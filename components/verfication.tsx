'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Copy, RefreshCw } from 'lucide-react'

export function VerificationPage() {
  const [publicKey, setPublicKey] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [verificationCommand, setVerificationCommand] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isCopied, setIsCopied] = useState(false)
  const router = useRouter()

  const generateKeys = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/generate_keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const data = (await response.json()).data

      if (response.ok) {
        setPublicKey(data.public_key)
        setPrivateKey(data.private_key)
        setVerificationCommand(`ellyesidiom_web_auth ${data.public_key}`)
        setCurrentStep(2)
      } else {
        throw new Error(data.error || '生成密钥失败')
      }
    } catch (error: any) {
      setError(`生成密钥时发生错误：${error.message}`)
      console.error('生成密钥错误:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkVerificationStatus = async () => {
    try {
      const response = await fetch('/api/auth/check_verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_key: publicKey, private_key: privateKey }),
      })
      const data = (await response.json()).data
      if (response.ok && data.verified) {
        setIsVerified(true)
        setUserId(data.user_id)
        setCurrentStep(3)
        // 验证成功后重定向到下一页
        setTimeout(() => router.push('/'), 3000)
      }
    } catch (error) {
      console.error('检查验证状态时出错:', error)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (publicKey && !isVerified) {
      interval = setInterval(checkVerificationStatus, 5000) // 每5秒检查一次
    }
    return () => clearInterval(interval)
  }, [publicKey, isVerified])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(verificationCommand)
      .then(() => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      })
      .catch(err => console.error('复制失败: ', err))
  }, [verificationCommand])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">验证流程</h1>
        <div className="space-y-8">
          <Step
            number={1}
            title="生成密钥"
            isActive={currentStep === 1}
            isCompleted={currentStep > 1}
          >
            <button
              onClick={generateKeys}
              disabled={isLoading || currentStep !== 1}
              className={`w-full ${
                isLoading || currentStep !== 1
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:-translate-y-1`}
            >
              {isLoading ? (
                <RefreshCw className="animate-spin inline-block mr-2" size={20} />
              ) : null}
              {isLoading ? '生成中...' : '生成密钥'}
            </button>
          </Step>

          <Step
            number={2}
            title="复制验证命令"
            isActive={currentStep === 2}
            isCompleted={currentStep > 2}
          >
            {verificationCommand && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm mb-2 text-gray-600">点击下方区域复制验证命令：</p>
                <div
                  onClick={copyToClipboard}
                  className={`flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                    isCopied ? 'bg-green-50 border-green-200' : ''
                  }`}
                >
                  <code className="text-sm text-gray-800">{verificationCommand}</code>
                  <div className={`ml-2 ${
                    isCopied ? 'text-green-500' : 'text-gray-400'
                  }`}>
                    {isCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </div>
                </div>
                {isCopied && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-green-500 text-sm mt-2"
                  >
                    已复制到剪贴板
                  </motion.p>
                )}
              </div>
            )}
          </Step>

          <Step
            number={3}
            title="验证状态"
            isActive={currentStep === 3}
            isCompleted={isVerified}
          >
            {isVerified ? (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-green-500 font-semibold"
              >
                验证成功！您的用户ID是：{userId}。正在重定向到首页...
              </motion.p>
            ) : currentStep >= 2 ? (
              <p className="text-blue-500">等待验证中...</p>
            ) : null}
          </Step>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-red-500 text-center"
          >
            {error}
          </motion.p>
        )}
      </div>
    </div>
  )
}

interface StepProps {
  number: number
  title: string
  isActive: boolean
  isCompleted: boolean
  children: React.ReactNode
}

function Step({ number, title, isActive, isCompleted, children }: StepProps) {
  return (
    <div className={`${isActive ? 'opacity-100' : 'opacity-60'} transition-opacity duration-300`}>
      <div className="flex items-center mb-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
            isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-300'
          } text-white font-bold transition-colors duration-300`}
        >
          {isCompleted ? <CheckCircle size={20} /> : number}
        </div>
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="ml-13">{children}</div>
    </div>
  )
}
