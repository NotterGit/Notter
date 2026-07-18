import { images } from "@/config/routing/image.route"
import { Card } from "./card"

export function About(){
    return (
        <div className="space-y-2">
            <Card
                name="Просто и удобно"
                description="Мы предоставляем простое, удобное, а главное бесплатное приложения"
                img={images.ICON.LAMP}
            />
            <Card
                name="Функционально"
                description="Большой функционал которого должно хватить для простых и средних задач"
                img={images.ICON.OPTIONS}
            />
            <Card
                name="Работай в команде"
                description="В Notter присутствует поддержка организаций из Qual ID для работы в команде"
                img={images.ICON.PEOPLE}
            />
            <Card
                name="Синхронизируй"
                description="Синхронизируя данные вы можете работать с любого устройства"
                img={images.ICON.ECOSYSTEM}
            />
        </div>
    )
}