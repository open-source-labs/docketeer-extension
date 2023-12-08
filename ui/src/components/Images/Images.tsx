import React, { SyntheticEvent, useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../reducers/hooks';
import { createAlert, createPrompt } from '../../reducers/alertReducer';
import styles from './Images.module.scss';
import globalStyles from '../global.module.scss';
import { ImageType } from 'types';
import { fetchImages } from '../../reducers/imageReducer';
import Client from '../../models/Client';
import ImageCard from '../ImageCard/ImageCard';
import ImagesSummary from '../ImagesSummary/ImagesSummary';

/**
 * @module | Images.tsx
 * @description | Provides ability to pull images from DockerHub image repository, run images, and remove images
 **/

// ---------------------------------------------
// eslint-disable-next-line react/prop-types
// optional TestParams for testing only

export interface TestParams {
  imagesListTest?: ImageType[];
}
// ---------------------------------------------

const Images = (params?: TestParams): React.JSX.Element => {
  console.log('Running images function');
  const reduxImagesList = useAppSelector((state) => state.images.imagesList);
  const imagesList: ImageType[] = params.imagesListTest ? params.imagesListTest : reduxImagesList;
  
  const dispatch = useAppDispatch();
  
  // on initial render, send a dispatch that will fetch the list of docker images from the backend
  useEffect(() => {
    dispatch(fetchImages());
  }, []);

  const runImage = async (image: ImageType) => {
    const success = await Client.ImageService.runImage(
      image.Repository,
      image.Tag
    );
    if (success) dispatch(fetchImages());
  };

  const removeImage = async (imageId: string) => {
    const success = await Client.ImageService.removeImage(imageId);
    if (success) dispatch(fetchImages());
  };

  const runImageAlert = (imgObj: ImageType) => {
    dispatch(
      createPrompt(
        `Are you sure you want to run ${imgObj.Repository}?`,
        () => {
          runImage(imgObj);
          dispatch(
            createAlert(`Running ${imgObj.Repository}...`, 2, "success")
          );
        },
        () => {
          dispatch(
            createAlert(
              `The request to run ${imgObj.Repository} has been cancelled.`,
              2,
              "warning"
            )
          );
        }
      )
    );
  };

  const removeImageAlert = (imgObj: ImageType) => {
    dispatch(
      createPrompt(
        `Are you sure you want to remove ${imgObj.Repository}?`,
        () => {
          removeImage(imgObj.ID);
          dispatch(
            createAlert(`Removing ${imgObj.Repository}...`, 2, "success")
          );
        },
        () => {
          dispatch(
            createAlert(
              `The request to remove ${imgObj.Repository} has been cancelled.`,
              2,
              "warning"
            )
          );
        }
      )
    );
  };

  // declare a constant array of elements and push an image card into this array for each image in the imagesList
  const renderedImages: React.JSX.Element[] = [];

  for(let i = 0; i < imagesList.length; i++) {
    renderedImages.push(<ImageCard removeImageAlert={removeImageAlert} runImageAlert={runImageAlert} key={i} imgObj={imagesList[i]}/>)
  }

  return (
    <div className={styles.ImagesContainer}>
      {/* VULNERABILITY SUMMARY INFO */}
      <div>
        <ImagesSummary/>
      </div>
      {/* IMAGE CARDS */}
      <div className={styles.ImagesCardsView}>
        {renderedImages}
      </div>
    
    </div>
  );
};

export default Images;
