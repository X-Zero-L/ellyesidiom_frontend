'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ImageDetails } from '@/app/types/image'

interface MasonryGridProps {
  items: ImageDetails[]
  columnWidth: number
  renderItem: (item: ImageDetails, index: number, onHeightChange: (height: number) => void) => React.ReactNode
}

export function MasonryGrid({ items, columnWidth, renderItem }: MasonryGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(1)
  const [itemHeights, setItemHeights] = useState<Record<string, number>>({})

  useEffect(() => {
    const updateColumns = () => {
      if (gridRef.current) {
        const newColumns = Math.max(1, Math.floor(gridRef.current.offsetWidth / columnWidth))
        setColumns(newColumns)
      }
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [columnWidth])

  const handleHeightChange = (index: number, height: number) => {
    setItemHeights(prev => {
      if (prev[index] === height) return prev
      return { ...prev, [index]: height }
    })
  }

  const renderedItems = useMemo(() => {
    const columnHeights = new Array(columns).fill(0)
    const newRenderedItems: React.ReactNode[][] = Array.from({ length: columns }, () => [])

    items.forEach((item, index) => {
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
      newRenderedItems[shortestColumnIndex].push(
        renderItem(item, index, (height) => handleHeightChange(index, height))
      )
      columnHeights[shortestColumnIndex] += itemHeights[index] || 0
    })

    return newRenderedItems
  }, [items, columns, itemHeights, renderItem])

  return (
    <div
      ref={gridRef}
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {renderedItems.map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-4">
          {column}
        </div>
      ))}
    </div>
  )
}

