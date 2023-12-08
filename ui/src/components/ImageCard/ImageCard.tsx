import React, {SetStateAction, useEffect, useState} from 'react';
import styles from './ImageCard.module.scss';
import { ImageCardProps } from 'types';
import Client from '../../models/Client';


/**
 * @module | ImageCard.tsx
 * @description | new components for images dashboard
 **/



function ImageCard({ imgObj, runImageAlert, removeImageAlert }: ImageCardProps): React.JSX.Element {

	// initialize state variable to store vulnerabilities
	const [scanObj, setScanObj] = useState({})

	const getScan = async (scanName: string) => { 
		// check if an image tag is <none>, and if it is, call getScan on this image - this is because scanning an Unused(dangling) image returns an error
		if (imgObj.Tag === "<none>") {
			setScanObj({ Critical: '-', High: '-', Medium: '-', Low: '-' })
			return;
		}
		// retrieve scan data - Client.ImageService.getScan creates DDClient Request
    const success = await Client.ImageService.getScan(scanName);
		console.log(`Success from getScan: ${scanName}`, success);

		// set state with scan data
		setScanObj(success)
  }

	// call getScan upon render for each card
	useEffect(() => { 		
		getScan(imgObj.ScanName)
	}, [])

	return (
		<div className={styles.imageCard}>

			{/* vulnerability info + run / remove functionality: RIGHT SIDE */}
			<div className={styles.imageInfo}>
				{/* image name: LEFT SIDE */}
				<div>
					<p className={styles.ImageName}>{imgObj['Repository']}</p>
				</div>
				
				{/* VULNERABILITY */}
				<div className={styles.VulnerabilitiesBlock}>
					<p className={styles.VulnerabilitiesTitle}>Vulnerabilities</p>
					<div className={styles.imageVulnerabilities}>
						<div className={styles.imgVulDiv}>
							<p className={styles.critical}>Critical</p>
							<p className={styles.critical}>{scanObj['Critical']} </p>
						</div>
						<div className={styles.imgVulDiv}>
							<p className={styles.high}>High</p>
							<p className={styles.high}>{scanObj['High']} </p>
						</div>
						<div className={styles.imgVulDiv}>
							<p className={styles.medium}>Med</p>
							<p className={styles.medium}>{scanObj['Medium']} </p>
						</div>
						<div className={styles.imgVulDiv}>
							<p className={styles.low}>Low</p>
							<p className={styles.low}>{scanObj['Low']} </p>
						</div>
					</div>
				</div>
			</div>

				{/* RUN / REMOVE */}
				<div className={styles.buttons}>
					<button className={styles.imgCardButton} onClick={() => runImageAlert(imgObj)}>RUN</button>
					<button className={styles.imgCardButton} onClick={() => removeImageAlert(imgObj)}>DELETE IMAGE</button>
				</div>
		</div>
	)
}

export default ImageCard;