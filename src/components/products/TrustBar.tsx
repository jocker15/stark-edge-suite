import { Shield, Zap, Star, Headphones } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'

export function TrustBar() {
  const { lang } = useLanguage()
  
  const trustItems = [
    {
      icon: Shield,
      title: lang === 'ru' ? 'Гарантия безопасности' : 'Security Guarantee',
      description: lang === 'ru' ? 'Все товары проверяются вручную' : 'All products are manually verified',
    },
    {
      icon: Zap,
      title: lang === 'ru' ? 'Мгновенная доставка' : 'Instant Delivery',
      description: lang === 'ru' ? 'Получите доступ сразу после оплаты' : 'Get access immediately after payment',
    },
    {
      icon: Star,
      title: lang === 'ru' ? 'Эксклюзивные товары' : 'Exclusive Products',
      description: lang === 'ru' ? 'Уникальные предложения только для вас' : 'Unique offers just for you',
    },
    {
      icon: Headphones,
      title: lang === 'ru' ? 'Поддержка 24/7' : '24/7 Support',
      description: lang === 'ru' ? 'Мы всегда на связи' : 'We are always in touch',
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
