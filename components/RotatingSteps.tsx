'use client'

import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// Add keyframes for progress animation
const progressKeyframes = `
  @keyframes fillProgress {
    from {
      transform: scaleY(1);
    }
    to {
      transform: scaleY(0);
    }
  }
`

interface RotatingStepsProps {
  steps?: Array<{
    title: string
    description: string
    icon?: React.ReactNode
    content: React.ReactNode
    codeSnippet?: string
  }>
  autoRotateDelay?: number
  className?: string
}

export function RotatingSteps({
  steps = [
    {
      title: "Write your config file.",
      description: "Specify nodes, priority, and GPU types in one simple YAML file.",
      icon: (
        <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.75 1.75H14.75C14.75 1.35218 14.592 0.970644 14.3107 0.68934C14.0294 0.408035 13.6478 0.25 13.25 0.25H2C1.60218 0.25 1.22064 0.408035 0.93934 0.68934C0.658035 0.970644 0.5 1.35218 0.5 1.75V9.25C0.5 9.64782 0.658035 10.0294 0.93934 10.3107C1.22064 10.592 1.60218 10.75 2 10.75H2.75V16.75C2.75 17.1478 2.90804 17.5294 3.18934 17.8107C3.47064 18.092 3.85218 18.25 4.25 18.25H17.75C18.1478 18.25 18.5294 18.092 18.8107 17.8107C19.092 17.5294 19.25 17.1478 19.25 16.75V3.25C19.25 2.85218 19.092 2.47064 18.8107 2.18934C18.5294 1.90804 18.1478 1.75 17.75 1.75ZM8.96937 3.78062C8.82864 3.63989 8.74958 3.44902 8.74958 3.25C8.74958 3.05098 8.82864 2.86011 8.96937 2.71938C9.11011 2.57864 9.30098 2.49958 9.5 2.49958C9.69902 2.49958 9.88989 2.57864 10.0306 2.71938L12.2806 4.96937C12.3504 5.03903 12.4057 5.12175 12.4434 5.21279C12.4812 5.30384 12.5006 5.40144 12.5006 5.5C12.5006 5.59856 12.4812 5.69616 12.4434 5.78721C12.4057 5.87825 12.3504 5.96097 12.2806 6.03063L10.0306 8.28063C9.88989 8.42136 9.69902 8.50042 9.5 8.50042C9.30098 8.50042 9.11011 8.42136 8.96937 8.28063C8.82864 8.13989 8.74958 7.94902 8.74958 7.75C8.74958 7.55098 8.82864 7.36011 8.96937 7.21937L10.6897 5.5L8.96937 3.78062ZM2.96938 6.03063C2.89964 5.96097 2.84432 5.87825 2.80658 5.78721C2.76884 5.69616 2.74941 5.59856 2.74941 5.5C2.74941 5.40144 2.76884 5.30384 2.80658 5.21279C2.84432 5.12175 2.89964 5.03903 2.96938 4.96937L5.21937 2.71938C5.36011 2.57864 5.55098 2.49958 5.75 2.49958C5.94902 2.49958 6.13989 2.57864 6.28063 2.71938C6.42136 2.86011 6.50042 3.05098 6.50042 3.25C6.50042 3.44902 6.42136 3.63989 6.28063 3.78062L4.56031 5.5L6.28063 7.21937C6.42136 7.36011 6.50042 7.55098 6.50042 7.75C6.50042 7.94902 6.42136 8.13989 6.28063 8.28063C6.13989 8.42136 5.94902 8.50042 5.75 8.50042C5.55098 8.50042 5.36011 8.42136 5.21937 8.28063L2.96938 6.03063ZM17.75 16.75H4.25V10.75H13.25C13.6478 10.75 14.0294 10.592 14.3107 10.3107C14.592 10.0294 14.75 9.64782 14.75 9.25V3.25H17.75V16.75Z" fill="currentColor"/>
        </svg>
      ),
      content: (
        <img
          src="https://cdn.prod.website-files.com/674afcec6748393670f59db0/67d8b7cc40713e8d00131b76_how-it-works-1.svg"
          alt=""
          className="w-full h-full object-contain"
        />
      )
    },
    {
      title: "Deploy with one command.",
      description: "Launch your job with a single CLI command, we handle the rest.",
      icon: (
        <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.70406 10.5459C5.59918 10.4414 5.51597 10.3172 5.45918 10.1805C5.4024 10.0437 5.37318 9.89713 5.37318 9.74906C5.37318 9.601 5.4024 9.45439 5.45918 9.31764C5.51597 9.1809 5.59918 9.0567 5.70406 8.95219L7.95406 6.70219C8.16541 6.49084 8.45205 6.37211 8.75094 6.37211C9.04982 6.37211 9.33647 6.49084 9.54781 6.70219C9.75916 6.91353 9.87789 7.20018 9.87789 7.49906C9.87789 7.79795 9.75916 8.08459 9.54781 8.29594L9.21875 8.625H14.375V6.75C14.375 6.45163 14.4935 6.16548 14.7045 5.9545C14.9155 5.74353 15.2016 5.625 15.5 5.625C15.7984 5.625 16.0845 5.74353 16.2955 5.9545C16.5065 6.16548 16.625 6.45163 16.625 6.75V9.75C16.625 10.0484 16.5065 10.3345 16.2955 10.5455C16.0845 10.7565 15.7984 10.875 15.5 10.875H9.21875L9.54875 11.2041C9.76009 11.4154 9.87883 11.7021 9.87883 12.0009C9.87883 12.2998 9.76009 12.5865 9.54875 12.7978C9.33741 13.0092 9.05076 13.1279 8.75187 13.1279C8.45299 13.1279 8.16634 13.0092 7.955 12.7978L5.70406 10.5459ZM21.125 2.25V15.75C21.125 16.2473 20.9275 16.7242 20.5758 17.0758C20.2242 17.4275 19.7473 17.625 19.25 17.625H2.75C2.25272 17.625 1.77581 17.4275 1.42417 17.0758C1.07254 16.7242 0.875 16.2473 0.875 15.75V2.25C0.875 1.75272 1.07254 1.27581 1.42417 0.924175C1.77581 0.572544 2.25272 0.375 2.75 0.375H19.25C19.7473 0.375 20.2242 0.572544 20.5758 0.924175C20.9275 1.27581 21.125 1.75272 21.125 2.25ZM18.875 2.625H3.125V15.375H18.875V2.625Z" fill="currentColor"/>
        </svg>
      ),
      content: (
        <img
          src="https://cdn.prod.website-files.com/674afcec6748393670f59db0/67d4a73dd436f8ae419be1e0_how-it-works-2.svg"
          alt=""
          className="w-full h-full object-contain"
        />
      )
    },
    {
      title: "Watch it scale.",
      description: "Monitor your training progress across nodes in real-time.",
      icon: (
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.6763 3.54661C17.6694 2.53748 16.4727 1.73768 15.1552 1.19334C13.8377 0.648994 12.4255 0.370884 11 0.375046H10.9616C4.98594 0.395671 0.125 5.3213 0.125 11.356V13.5C0.125 13.9973 0.322544 14.4742 0.674175 14.8259C1.02581 15.1775 1.50272 15.375 2 15.375H20C20.4973 15.375 20.9742 15.1775 21.3258 14.8259C21.6775 14.4742 21.875 13.9973 21.875 13.5V11.25C21.8789 9.8181 21.5981 8.39967 21.049 7.07721C20.4998 5.75474 19.6933 4.55462 18.6763 3.54661ZM19.625 13.125H10.9362L15.29 7.0313C15.3762 6.91114 15.4378 6.77518 15.4715 6.63119C15.5051 6.48719 15.5101 6.33799 15.486 6.19208C15.462 6.04618 15.4095 5.90644 15.3315 5.78083C15.2534 5.65523 15.1514 5.54623 15.0312 5.46005C14.9111 5.37387 14.7751 5.3122 14.6311 5.27856C14.4871 5.24492 14.3379 5.23998 14.192 5.264C14.0461 5.28803 13.9064 5.34056 13.7808 5.41859C13.6552 5.49663 13.5462 5.59864 13.46 5.7188L8.17062 13.125H2.375V11.356C2.375 11.1947 2.375 11.0344 2.38812 10.875H4.25C4.54837 10.875 4.83452 10.7565 5.0455 10.5455C5.25647 10.3346 5.375 10.0484 5.375 9.75005C5.375 9.45168 5.25647 9.16553 5.0455 8.95455C4.83452 8.74357 4.54837 8.62505 4.25 8.62505H2.80812C3.83094 5.49473 6.55812 3.1388 9.875 2.69911V4.50005C9.875 4.79841 9.99353 5.08456 10.2045 5.29554C10.4155 5.50652 10.7016 5.62505 11 5.62505C11.2984 5.62505 11.5845 5.50652 11.7955 5.29554C12.0065 5.08456 12.125 4.79841 12.125 4.50005V2.70005C13.7476 2.91297 15.2762 3.58314 16.5322 4.63228C17.7881 5.68143 18.7197 7.06626 19.2181 8.62505H17.75C17.4516 8.62505 17.1655 8.74357 16.9545 8.95455C16.7435 9.16553 16.625 9.45168 16.625 9.75005C16.625 10.0484 16.7435 10.3346 16.9545 10.5455C17.1655 10.7565 17.4516 10.875 17.75 10.875H19.6156C19.6212 10.9997 19.625 11.1244 19.625 11.25V13.125Z" fill="currentColor"/>
        </svg>
      ),
      content: (
        <img
          src="https://cdn.prod.website-files.com/674afcec6748393670f59db0/67d4a7b661a736762d1481fc_how-it-works-3.svg"
          alt=""
          className="w-full h-full object-contain"
        />
      )
    }
  ],
  autoRotateDelay = 5000,
  className
}: RotatingStepsProps) {
  const [activeStep, setActiveStep] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const userInteractedRef = useRef(false)

  // Inject CSS for progress animation
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = progressKeyframes
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Auto-rotate functionality
  useEffect(() => {
    const startInterval = () => {
      intervalRef.current = setInterval(() => {
        setActiveStep(prev => (prev + 1) % steps.length)
      }, autoRotateDelay)
    }

    // Start auto-rotation
    startInterval()

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [steps.length, autoRotateDelay])

  // Handle manual step selection
  const handleStepClick = (index: number) => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set the active step
    setActiveStep(index)
    userInteractedRef.current = true

    // Restart interval after delay
    setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setActiveStep(prev => (prev + 1) % steps.length)
      }, autoRotateDelay)
    }, autoRotateDelay)
  }

  return (
    <div className={cn("grid grid-cols-[685.711px,514.289px] gap-20 items-center", className)}>
      {/* Steps Menu on the LEFT */}
      <div className="relative flex flex-col gap-10"
        style={{
          backgroundImage: "url('https://cdn.prod.website-files.com/674afcec6748393670f59db0/6798773db144602ad9bbec21_new-line_desktop.png')",
          backgroundRepeat: 'no-repeat',
          backgroundSize: '2px 300px',
          backgroundPosition: '20px 50%'
        }}>
        {steps.map((step, index) => (
          <button
            key={index}
            onClick={() => handleStepClick(index)}
            className={cn(
              "relative flex items-center gap-10 py-4 text-left transition-all duration-300 group",
              "cursor-pointer"
            )}
          >
            {/* Step Icon Circle */}
            <div className={cn(
              "relative z-10 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300",
              "border border-[#3F3F46]",
              activeStep === index
                ? "bg-white"
                : "bg-[#09090B]"
            )}
              style={{
                marginLeft: '0px'
              }}
            >
              <div className={cn(
                "w-5 h-5 flex items-center justify-center",
                activeStep === index
                  ? "text-[#09090B]"
                  : "text-white"
              )}>
                {step.icon}
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 max-w-[350px]">
              <h3 className={cn(
                "font-medium text-[18px] mb-0 transition-colors duration-300 leading-[27px]",
                activeStep === index ? "text-white" : "text-white"
              )}>
                {step.title}
                <span className={cn(
                  "inline transition-colors duration-300",
                  activeStep === index ? "text-[#A1A1AA]" : "text-[#A1A1AA]"
                )}>
                  {' '}{step.description}
                </span>
              </h3>
            </div>
          </button>
        ))}
      </div>

      {/* Image Area on the RIGHT */}
      <div className="relative h-[540px] flex items-center justify-center overflow-hidden">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-all duration-500 ease-in-out",
              activeStep === index
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95"
            )}
          >
            {step.content}
          </div>
        ))}
      </div>
    </div>
  )
}