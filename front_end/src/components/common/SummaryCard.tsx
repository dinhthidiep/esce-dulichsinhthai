import type { SummaryCardProps } from '~/types/common'

const SummaryCar = ({
  bgColor = 'bg-gradient-to-br from-blue-50 to-blue-100',
  textColor = 'text-blue-600',
  borderColor,
  icon,
  title,
  value,
  subtitle
}: SummaryCardProps) => {
  return (
    <div
      className={`flex flex-col gap-[2.4rem]! p-[2.4rem]! rounded-4xl! shadow-lg hover:shadow-xl transition-shadow ${bgColor} ${borderColor} ${textColor}`}
    >
      <div className="flex items-center justify-between text-[1.4rem]! font-medium!">
        <h3>{title}</h3>
        {icon && <span>{icon}</span>}
      </div>
      <div>
        <span className={`text-[2.4rem]! font-bold!`}>{value}</span>
        {subtitle && <p className="text-[1.2rem]! font-normal!">{subtitle}</p>}
      </div>
    </div>
  )
}

export default SummaryCar
