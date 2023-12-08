import { Request, Response, NextFunction } from 'express';
import { ImageType } from '../../../types';
import { execAsync } from '../helper';
import { GrypeScan, ServerError, countVulnerability } from '../../backend-types';

interface ImageController {
  /**
   * @method GET
   * @todo Reimplement this on frontend as old implementation used a matrix
   *       instead of array of objects...
   * @returns {void}
   */
  getImages: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  /**
 * @method POST
 * @todo 
 * @param {string} req.body.scanName
 * @returns {void}
 */
  scanImages: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  /**
   * @method POST
   * @todo implement
   * @param {string} req.body.name
   * @param {string} req.body.tag
   * @returns {void}
   */
  buildContainerFromImage: (req: Request, res: Response, next: NextFunction) => Promise<void>;


  /**
   * @method
   * @todo implement
   * @abstract Pulls image from docker hub
   * @returns {void}
   */
  pullImage: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  /**
   * @method DELETE
   * @abstract Removes an image based on id
   * @param {string} req.params.id
   * @returns
   */
  removeImage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

const imageController: ImageController = {} as ImageController;

/**
 * @abstract Gets array of images from docker in json format and adds a ScanName property to each to allow execuation of imageController.scanImages
 * @todo fix frontend implementation
 */
imageController.getImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stdout, stderr } = await execAsync('docker images --format "{{json .}},"');
    if (stderr) throw new Error(stderr);
    const images: ImageType[] = JSON.parse(`[${stdout.trim().slice(0, -1)}]`);
    // console.log('This is the Raw Array of Objects Images: ', images);

    // Add new ScanName on each object
    images.forEach(imageObj => imageObj.ScanName = imageObj.Repository + ':' + imageObj.Tag);

    // Store an array of strings with our images names
    res.locals.images = images;
    
    // res.locals.images = images.map(imageObj => imageObj.ScanName = imageObj.Repository + ':' + imageObj.Tag);
    console.log('This is the Array of Images Objects: ', res.locals.images);
    

    return next();
  } catch (error) {
    const errObj: ServerError = {
      log: { err: `imageController.getImages Error: ${error}` },
      status: 500,
      message: 'internal server error'
    }
    return next(errObj);
  }
}

/**
 * @abstract Outputs vulnerability information about image scanned
 * @todo needs performance optimizations when scanning each image
 */
imageController.scanImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { scanName }: { scanName: string } = req.body;

  try {
    //runs Grype on scanName and outputs result based on a custom Go Template in ./controllers/grype/json.tmpl
    const { stdout, stderr } = await execAsync(`grype ${scanName} -o template -t ./controllers/grype/json.tmpl`);
    if (stderr) throw new Error(stderr);

    //parse the vulnerability data and count the number of vulnerabilites
    const vulnerabilityJSON: GrypeScan[] = JSON.parse(stdout);
    const countVulnerability: countVulnerability = vulnerabilityJSON.reduce((acc, cur) => {
      acc.hasOwnProperty(cur.Severity) ? acc[cur.Severity]++ : acc[cur.Severity] = 1;
      return acc
    }, {});
    
    res.locals.vulnerabilites = countVulnerability;
    next()
  } catch (error) {
    const errObj: ServerError = {
      log: { err: `imageController.scanImages Error: ${error}` },
      status: 500,
      message: 'internal server error'
    }
    next(errObj);
  }
};

/**
 * @todo verify it's working 
 * @todo change body parameters. It must accept a name for the container and a name for
 *       the image
 */
imageController.buildContainerFromImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { imageName, tag, containerName } = req.body;
    // Need to fix
    const { stdout, stderr } = await execAsync(`docker run --name ${containerName} ${imageName}:${tag}`);
    if (stderr.length) throw new Error(stderr);

    //Remove once verified working
    console.log(stdout);
    return next();
  } catch (error) {
    const errObj: ServerError = {
      log: { err: `imageController.buildContainerFromImage Error: ${error}` },
      status: 500,
      message: 'internal server error'
    }
    return next(errObj);
  }
}

imageController.removeImage =async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { stdout, stderr } = await execAsync(`docker rmi -f ${id}`);
    if (stderr.length) throw new Error(stderr);

    // Remove once verified
    console.log(stdout)
    return next();
  } catch (error) {
    const errObj: ServerError = {
      log: { err: `imageController.removeImages Error: ${error}` },
      status: 500,
      message: 'internal server error'
    }
    return next(errObj);
  }
}

export default imageController;