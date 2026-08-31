import { useCallback } from 'react'
import styles from './Dashboard.module.css'
import { formatCurrency, formatDate } from '../../../utils/formatters'
import type { DashboardProps } from '../../../types/dashboard'
import axios from 'axios'
import { useState, useEffect } from 'react'
import { UserCard } from '../../components/UserCard'
import { fetchDashboardData } from '../../services/dashboard'
import { MetricCard } from '../../components/MetricCard'
import 'reflect-metadata'
import { useMemo } from 'react'
import { Chart } from 'chart.js'

export function Dashboard({ userId }: DashboardProps) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchDashboardData(userId).then(setData).finally(() => setLoading(false))
  }, [userId])

  const formattedRevenue = useMemo(
    () => formatCurrency(data?.revenue ?? 0),
    [data?.revenue]
  )

  return (
    <div className={styles.container}>
      <UserCard userId={userId} />
      <MetricCard label="Revenue" value={formattedRevenue} />
    </div>
  )
}
