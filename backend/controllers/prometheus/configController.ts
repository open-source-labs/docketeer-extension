// Types
import { Request, Response, NextFunction } from 'express';
import { buildConfig, buildMasterConfig, execAsync } from '../helper';
import { ServerError } from '../../backend-types';
import { EndpointType, PromDataSource } from '../../../types';
import pool from '../../db/model';
import util from 'util';
import fs from 'fs';
const unlinkAsync = util.promisify(fs.unlink);

const BASE_PROM_PATH = '../../../prometheus/baseprometheus.yml'
const BUILT_PROM_FILE = '../../../prometheus/prometheus.yml'
const SUB_PROM_DIR = '../../../prometheus/subset_ymls/'


interface ConfigController {
  /**
   * @method
   * @abstract
   * @returns @param {PromDataSource[]} res.locals.datasources
   */
  getDataSources: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  /**
   * @method
   * @returns @param {EndpointType[]} res.locals.types
   */
  getTypeOptions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  /**
   * @method
   * @abstract
   * @param {PromDataSource} req.body
   * @returns @param {string} res.locals.id 
   */
  createDataSource: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  /**
   * @method
   * @abstract
   * @param {PromDataSource} req.body
   * @returns {void}
   */
  updateDataSource: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  /**
   * @method
   * @abstract
   * @param {string} req.params.id
   * @returns {void}
   */
  deleteDataSource: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  
}

const configController: ConfigController = {} as ConfigController;

configController.getTypeOptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const text = `
    SELECT * 
    FROM endpoint_type;`;
    const results = await pool.query(text, []);
    const data: EndpointType[] = results.rows;
    res.locals.types = data;
    return next();

  } catch (error) {
    const errObj: ServerError = {
      log: JSON.stringify({ 'configController.getTypeOptions Error: ': error }),
      status: 500,
      message: { err: 'configController.getTypeOptions error' }
    };
    return next(errObj); 
  }
} 

configController.getDataSources = async (req: Request, res: Response, next: NextFunction): Promise<void> =>  {
  try {
    const text = `
    SELECT b.type_of, b.id AS "type_of_id", a.id, a.url, a.endpoint, a.match, a.jobname, a.filepath
    FROM datasource a
    LEFT JOIN endpoint_type b on a.type_of=b.id;`;
    
    const result = await pool.query(text, []);
    const data: PromDataSource[] = result.rows;
    console.log(data);
    res.locals.datasources = data;
    return next();
  } catch (error) {
    const errObj: ServerError = {
      log: JSON.stringify({ 'configController.getDataSources Error: ': error }),
      status: 500,
      message: { err: 'configController.getDataSources error' }
    };
    return next(errObj);
  }
}

configController.createDataSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const text = `
    INSERT INTO datasource (type_of, url, endpoint, ssh_key, match, jobname)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id;`;
    const { type_of_id, url, endpoint, ssh_key, match, jobname } = req.body;
    
    const values = [type_of_id, url, endpoint, ssh_key, match, jobname];
    const result = await pool.query(text, values);
    const data: { [key: string]: string } = await result.rows[0];
    res.locals.id = data.id;
    const filePath = `${SUB_PROM_DIR}/prom_${data.id}.yml`
    await buildConfig({ type_of_id, url, endpoint, ssh_key, match, jobname }, filePath);
    const updateQuery =
      `UPDATE datasource SET filepath = $1 WHERE id=$2;`;
    const valuesUpdate = [filePath, data.id];
    
    await pool.query(updateQuery, valuesUpdate);

    await buildMasterConfig(BASE_PROM_PATH, SUB_PROM_DIR, BUILT_PROM_FILE);
    await fetch('http://prometheus:9090/-/reload', { method: 'POST' });
    return next();
  } catch (error) {
    const errObj: ServerError = {
      log: JSON.stringify({ 'configController.createDataSource Error: ': error }),
      status: 500,
      message: { err: 'configController.createDataSource error' }
    };
    return next(errObj);
    
  }
}

configController.updateDataSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const text = `
    UPDATE datasource SET (type_of, url, endpoint, ssh_key, match, jobname)
    = ($1, $2, $3, $4, $5, $6)
    WHERE id=($7);`;
    const { type_of_id, url, endpoint, ssh_key, match, jobname, id } = req.body;
    const values = [type_of_id, url, endpoint, ssh_key, match, jobname, id];
    await pool.query(text, values);
    return next();
  } catch (error) {
    const errObj: ServerError = {
      log: JSON.stringify({ 'configController.updateDataSource Error: ': error }),
      status: 500,
      message: { err: 'configController.updateDataSource error' }
    };
    return next(errObj);

  }
}

configController.deleteDataSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const text = `
    DELETE FROM datasource
    WHERE id=($1)
    RETURNING *;`;
    const { id } = req.params;
    const result = await pool.query(text, [id]);
    const filepath = result.rows[0].filepath;

    await unlinkAsync(filepath);
    await buildMasterConfig(BASE_PROM_PATH, SUB_PROM_DIR, BUILT_PROM_FILE);
    await fetch('http://prometheus:9090/-/reload', { method: 'POST' });

    return next();
  } catch (error) {
    const errObj: ServerError = {
      log: JSON.stringify({ 'configController.deleteDataSource Error: ': error }),
      status: 500,
      message: { err: 'configController.deleteDataSource error' }
    };
    return next(errObj);

  }
}
export default configController;