import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface StepperProps {
    steps: {
        id: number
        label: string
    }[]
    currentStep: number
}

export function Stepper({ steps, currentStep }: StepperProps) {
    return (
        <div className="mx-auto w-full max-w-4xl px-4 py-6 overflow-x-auto pb-10 scrollbar-thin">
            <div className="relative flex items-center justify-between min-w-[400px]">
                {/* Progress Bar Background */}
                <div className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 rounded bg-muted"></div>

                {/* Active Progress Bar */}
                <div
                    className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded bg-green-600 transition-all duration-300"
                    style={{
                        width: `${Math.min(100, ((currentStep - 1) / (steps.length - 1)) * 100)}%`
                    }}
                ></div>

                {steps.map((step) => {
                    const isCompleted = currentStep > step.id
                    const isCurrent = currentStep === step.id

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <div
                                className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background transition-colors",
                                    isCompleted
                                        ? "border-green-600 bg-green-600 text-white"
                                        : isCurrent
                                            ? "border-red-600 text-red-600"
                                            : "border-muted text-muted-foreground"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <span className="text-xs font-semibold">{step.id}</span>
                                )}
                            </div>
                            <span className={cn(
                                "absolute -bottom-8 w-max text-xs font-medium",
                                isCurrent ? "text-red-600 font-bold" : "text-muted-foreground"
                            )}>
                                {step.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
