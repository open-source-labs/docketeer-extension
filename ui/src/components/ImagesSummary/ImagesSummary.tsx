import React from 'react';
import { useState, useEffect } from 'react';
import styles from './ImagesSummary.module.scss';

/**
 * @module | ImagesSummary.tsx
 * @description | displays a summary of vulnerabilities across all images
 **/

const ImagesSummary = (): React.JSX.Element => {

  const [summary, setSummary] = useState({
    c: 0,
    h: 0,
    m: 0,
    l: 0
  });

  useEffect(() => {
    // reset state with props
    setSummary({c: 20, h: 30, m: 40, l: 10})
  }, [])

  return (
    <div className={styles.summaryCard}>
      
      {/* CRITICAL */}
      <div className={styles.critical} style={{ width: summary.c + '%' }}>
        <p className={styles.textColor}>CRITICAL</p>
      </div>
      
      {/* HIGH */}
      <div className={styles.high} style={{ width: summary.h + '%' }}>
        <p className={styles.textColor}>HIGH</p>
      </div>
      
      {/* MED */}
      <div className={styles.med} style={{ width: summary.m + '%' }}>
        <p className={styles.textColor}>MEDIUM</p>
      </div>
      
      {/* LOW */}
      <div className={styles.low} style={{ width: summary.l + '%' }}>
        <p className={styles.textColor}>LOW</p>
      </div>
    
    </div>
  )
}

export default ImagesSummary;