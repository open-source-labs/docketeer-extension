import { Router, Request, Response, NextFunction } from 'express';
import imageController from '../../controllers/docker/imagesController';
import containerController from '../../controllers/docker/containersController';
import { log } from 'console';
const router = Router();

/**
 * @abstract 
 * @todo 
 * @param 
 * @returns
 */
router.get('/', imageController.getImages, (req, res) => {
  return res.status(200).json(res.locals.images);
});

/**
 * @abstract 
 * @todo 
 * @param 
 * @returns
 */
router.post('/scan', imageController.scanImages, (req, res) => {
  res.set('Cache-control', 'public, max-age=86400')
  return res.status(200).json(res.locals.vulnerabilites);
});

/**
 * @abstract Scans an using Grype CLI and summarizes the report's vulnerabilities by severity
 * @todo 
 * @param req.body.scanName
 * @returns count of vulnerabilities in this format: {
    "Low": 19,
    "Medium": 11,
    "Negligible": 3
}
 */
router.get('/:id');

/**
 * @abstract 
 * @todo Move buildContainerFromImage to the containercontroller
 * @param req.body.name
 * @param req.body.tag
 * @returns containers
 */
router.post('/run', imageController.buildContainerFromImage, (req, res) => {
  return res.sendStatus(201);
});

/**
 * @abstract 
 * @todo 
 * @param 
 * @returns
 */
router.delete('/:id', imageController.removeImage, (req, res) => {
  return res.sendStatus(204);
});

export default router;