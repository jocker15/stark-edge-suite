import { useLocation, Link } from "react-router-dom"
import { useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-9xl font-bold text-primary">404</h1>
            <h2 className="text-3xl font-semibold text-foreground">Страница не найдена</h2>
            <p className="text-lg text-muted-foreground">
              К сожалению, страница, которую вы ищете, не существует или была перемещена.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="min-w-[200px]">
              <Link to="/">
                <Home className="mr-2 h-5 w-5" />
                На главную
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[200px]">
              <Link to="/game-accounts">
                <Search className="mr-2 h-5 w-5" />
                Каталог товаров
              </Link>
            </Button>
          </div>

          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Нужна помощь?{" "}
              <Link to="/help-center" className="text-primary hover:underline">
                Свяжитесь с поддержкой
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default NotFound
