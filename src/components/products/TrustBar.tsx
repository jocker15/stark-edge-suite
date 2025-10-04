import { Shield, Zap, Star, Headphones } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function TrustBar() {
  const trustItems = [
    {
      icon: Shield,
      title: 'Гарантия безопасности',
      description: 'Все товары проверяются вручную',
    },
    {
      icon: Zap,
      title: 'Мгновенная доставка',
      description: 'Получите доступ сразу после оплаты',
    },
    {
      icon: Star,
      title: 'Эксклюзивные товары',
      description: 'Уникальные предложения только для вас',
    },
    {
      icon: Headphones,
      title: 'Поддержка 24/7',
      description: 'Мы всегда на связи',
    },
  ]

  return (
    <Card className="my-8">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm leading-tight">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
