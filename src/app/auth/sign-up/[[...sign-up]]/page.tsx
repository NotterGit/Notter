import { SignUp } from '@clerk/nextjs';
import { Metadata } from 'next';
import { images } from '@/config/routing/image.route';
import "../../style.css"

export const metadata: Metadata = {
  title: "Qual ID Auth",
  description: "SignUp",
  icons: {
    icon: images.IMAGE.DARK_ICON,
  }
};

export default function SiginInPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-logo-yellow/10 px-4 py-10 text-foreground dark:to-logo-cyan/10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-logo-light-yellow/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-logo-cyan/15 blur-3xl" />
      <SignUp />
      <div id='clerk-captcha'/>
    </main>
  );
}
