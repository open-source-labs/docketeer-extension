/* eslint-disable react/prop-types */
import React, { useState, SyntheticEvent } from 'react';
import { ContainerType } from '../../../types';
import { useAppSelector, useAppDispatch } from '../../reducers/hooks';
import useHelper from '../../helpers/commands';
import { createAlert, createPrompt } from '../../reducers/alertReducer';

import styles from './Containers.module.scss';
import ContainersCard from '../ContainersCard/ContainersCard';
import globalStyles from '../global.module.scss';

// import { connect } from 'http2';

/**
 * @module | Containers.tsx
 * @description | Provides information and management over both running & stopped Docker containers
 **/

const Containers = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const [network, setNetwork] = useState('');

  const { runStopped, remove, stop, networkContainers } = useHelper();

  const { runningList, stoppedList } = useAppSelector(
    (state) => state.containers
  );

  const stopContainer = (container: ContainerType) => {
    dispatch(
      createPrompt(
        `Are you sure you want to stop ${container.Names}?`,
        () => {
          stop(container.ID);
          dispatch(createAlert(`Stopping ${container.Names}...`, 5, 'error'));
        },
        () => {
          dispatch(
            createAlert(
              `The request to stop ${container.Names} has been cancelled.`,
              5,
              'warning'
            )
          );
        }
      )
    );
  };

  const runContainer = (container: ContainerType) => {
    dispatch(
      createPrompt(
        `Are you sure you want to run ${container.Names}?`,
        () => {
          runStopped(container['ID']);
          dispatch(createAlert(`Running ${container.Names}...`, 5, 'success'));
        },
        () => {
          dispatch(
            createAlert(
              `The request to run ${container.Names} has been cancelled.`,
              5,
              'warning'
            )
          );
        }
      )
    );
  };

  const removeContainer = (container: ContainerType) => {
    dispatch(
      createPrompt(
        `Are you sure you want to remove ${container.Names}?`,
        () => {
          remove(container['ID']);
          dispatch(createAlert(`Removing ${container.Names}...`, 5, 'success'));
        },
        () => {
          dispatch(
            createAlert(
              `The request to remove ${container.Names} has been cancelled.`,
              5,
              'warning'
            )
          );
        }
      )
    );
  };

  //
  const connectToNetwork = (container: ContainerType) => {
    dispatch(
      createPrompt(
        'Choose a network to connect to.',
        () => {
          networkContainers(container['ID']);
          dispatch(createAlert(`Connecting ${container.Names} to network.`, 5, 'success'));
        },
        () => {
          dispatch(
            createAlert(
              `The request to connect ${container.Names} to a network has been cancelled.`,
              5,
              'warning'
            )
          );
        }
      )
    );
  };

  //
  async function fetchNewNetwork(name: string): Promise<void> {
    try {
      const response = await fetch('/networkCreate', {
        method: 'POST',
        body: JSON.stringify({networkName : name}),
        headers: {'Content-Type': 'application/json'}
      });

      if (response.ok) {
        console.log('New network name has been sent');
      }
    } catch (err) {
      console.log('An error occurred while sending new network name:', err);
    }
  }

  // Invoked when 'Create new network' button is pressed. Sends POST request to backend with current state of input field in the body. Resets input field upon submission.
  const createNewNetwork = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    if (!network) {
      dispatch(
        createAlert(
          'Please enter a network name.',
          5,
          'error'
        )
      );
      return;
    } 
    e.preventDefault();
    console.log(network);
    fetchNewNetwork(network);
    setNetwork('');
    
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.listHolder}>
        <h2>RUNNING CONTAINERS</h2>
        <p className={styles.count}>Count: {runningList.length}</p>
        <input
          className={globalStyles.input}
          type="text"
          id='newNetwork'
          value={network}
          placeholder="Input network name here..."
          onChange={(e) => {
            setNetwork(e.target.value);
          }}
        />
        <button className={globalStyles.button1} onClick={(e) => createNewNetwork(e)}>
          CREATE NEW NETWORK
        </button>
        <div className={styles.containerList}>
          <ContainersCard
            containerList={runningList}
            stopContainer={stopContainer}
            runContainer={runContainer}
            removeContainer={removeContainer}
            connectToNetwork={connectToNetwork}
            status="running"
          />
        </div>
      </div>
      <div className={styles.listHolder}>
        <h2>STOPPED CONTAINERS</h2>
        <p className={styles.count}>Count: {stoppedList.length}</p>
        <div className={styles.containerList}>
          <ContainersCard
            containerList={stoppedList}
            stopContainer={stopContainer}
            runContainer={runContainer}
            removeContainer={removeContainer}
            connectToNetwork={connectToNetwork}
            status="stopped"
          />
        </div>
      </div>
    </div>
  );
};

export default Containers;
