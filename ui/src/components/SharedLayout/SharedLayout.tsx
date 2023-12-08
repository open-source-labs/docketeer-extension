import React, { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../reducers/hooks';
import { createAlert } from '../../reducers/alertReducer';
import { createPrunePrompt } from '../../reducers/pruneReducer';


import Alert from '../../components/Alert/Alert';
import SideBar from '../../components/SideBar/SideBar';

import styles from './SharedLayout.module.scss';
import docketeerLogo from '../../../assets/docketeer-logo-light.png';
import MenuIcon from '../../../assets/menu_icon.svg';
import {
  fetchRunningContainers,
  fetchStoppedContainers,
} from '../../reducers/containerReducer';
import { fetchImages } from '../../reducers/imageReducer';
import { fetchNetworkAndContainer } from '../../reducers/networkReducer';
import {
  fetchAllContainersOnVolumes,
  fetchAllDockerVolumes,
} from '../../reducers/volumeReducer';
import Client from '../../models/Client';

/**
 * @module | SharedLayout.tsx
 * @description | This component renders a navbar at the top that allows you to select which tab you would like to view.
 **/

function SharedLayout(): JSX.Element {
  // navBar useState
  const [isOpen, setIsOpen] = useState(false);

  // navBar functionality
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleNetworkPrune = async (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    e.preventDefault();
    const successful = await Client.NetworkService.pruneNetwork();
    if (!successful) console.error(`Coudn't prune network`);
  };

  const handleSystemPrune = async (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    e.preventDefault();
    const successful = await Client.SystemService.pruneSystem();
    if (!successful) console.error(`Coudn't prune system`);
  };

  const prune = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    toggleSidebar();
    
    dispatch(
      createPrunePrompt(
        // prompt (first argument in createPrunePrompt)
        'Are you sure you want to run system / network prune? System prune will remove all unused containers, networks, images and Network prune will remove all unused networks only (both dangling and unreferenced).',
        // handleSystemPrune (second argument in creatPrunePrompt)
        () => {
          handleSystemPrune(e);
          dispatch(createAlert('Performing system prune...', 2, 'success'));
        },
        // handleNetworkPrune (third argument in creatPrunePrompt)
        () => {
          handleNetworkPrune(e);
          dispatch(createAlert('Performing network prune...', 2, 'success'));
        },
        // handleDeny (fourth argument in creatPrunePrompt)
        () => {
          dispatch(
            createAlert(
              'The request to perform system / network prune has been cancelled.',
              2,
              'warning'
            )
          );
        }
      )
    );
  };
  
  const { volumes } = useAppSelector((state) => state.volumes);

  useEffect(() => {
    dispatch(fetchRunningContainers());
    dispatch(fetchStoppedContainers());
    dispatch(fetchImages());
    dispatch(fetchNetworkAndContainer());
    dispatch(fetchAllDockerVolumes());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dispatch(fetchAllContainersOnVolumes());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volumes]);

  return (
    <div>
      <nav className={styles.navBar}>
        <div className={styles.logo}>
          {/* LOGO */}
          <NavLink to="/">
            <img className={styles.logo}
              src={docketeerLogo}
              alt="docketeer-logo"
              width="45"
              height="45"
            ></img>
          </NavLink>
        </div>
        <div className={styles.navSpacer}>
          <ul>
            <li>
              <NavLink
                className={({ isActive }) =>
                  isActive ? styles.active : styles.navButton
                }
                to="/"
              >
                CONTAINERS
              </NavLink>
            </li>
            <li>
              <NavLink
                className={({ isActive }) =>
                  isActive ? styles.active : styles.navButton
                }
                to="/network"
              >
                NETWORKS
              </NavLink>
            </li>
            <li>
              <NavLink
                className={({ isActive }) =>
                  isActive ? styles.active : styles.navButton
                }
                to="/images"
              >
                IMAGES
              </NavLink>
            </li>
            <li>
              <img src={MenuIcon} className={styles.hamburgerIcon} onClick={toggleSidebar}>
              </img>
              {isOpen && <SideBar toggleSideBar={toggleSidebar} prune={prune} isOpen={isOpen}/>}
            </li>
          </ul>
        </div>
      </nav>
      <Alert />
      <Outlet />
    </div>
  );
}

export default SharedLayout;
