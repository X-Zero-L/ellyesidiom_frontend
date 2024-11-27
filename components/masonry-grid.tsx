'use client'

import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface MasonryGridProps {
  items: React.ReactNode[]
  columnWidth: number
}

export function MasonryGrid({ items, columnWidth }: MasonryGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(1)

  useEffect(() => {
    const updateColumns = () => {
      if (gridRef.current) {
        const newColumns = Math.floor(gridRef.current.offsetWidth / columnWidth)
        setColumns(newColumns || 1)
      }
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [columnWidth])

  const columnItems: React.ReactNode[][] = Array.from({ length: columns }, () => [])
  items.forEach((item, i) => {
    return columnItems[i % columns].push(item)
  })

  return (
    <div
      ref={gridRef}
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {columnItems.map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-4">
          {column.map((item, itemIndex) => (
            <motion.div
              key={itemIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: itemIndex * 0.1 }}
            >
              {item}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  )
}

