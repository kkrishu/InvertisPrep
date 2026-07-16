'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Mail } from 'lucide-react';

const heartBlink = `
  @keyframes heartBeat {
    0% { transform: scale(1); }
    15% { transform: scale(1.25); }
    30% { transform: scale(1); }
    45% { transform: scale(1.25); }
    60% { transform: scale(1); }
  }
  
  .heart-icon {
    display: inline-block;
    color: #ff3366;
    animation: heartBeat 2s infinite;
  }
`;

export default function Footer() {
  const pathname = usePathname();
  const footerLinks = {
    "Quick Links": [
      { name: "Home", path: "/" },
      { name: "Browse PYQ", path: "/pyq" },
      { name: "About", path: "/about" },
      { name: "Our Team", path: "/our-team" },
    ],
    "Resources": [
      { name: "Study Materials", path: "/pyq" },
      { name: "Previous Year Papers", path: "/pyq" },
      { name: "Syllabus", path: "/resources/syllabus" },
    ],
    "Support": [
      { name: "Help & Support", path: "/support" },
      { name: "Privacy Policy", path: "/privacy-policy" },
      { name: "Terms of Service", path: "/terms-of-service" },
    ],
    "Admin": [
      { name: "Admin Login", path: "/admin/login" },
    ],
  };

  // Hide footer on view pages
  if (pathname && (pathname.includes('/view/') || pathname.startsWith('/view/'))) {
    return null;
  }

  return (
    <footer className="bg-gray-900 text-gray-200">
      <style>{heartBlink}</style>

      {/* Desktop Footer */}
      <div className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                INVERTISPREP <span className="text-sm">v2</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400">
              Your gateway to academic excellence at Invertis University.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={`${title}-${link.name}-${link.path}`}>
                    <Link
                      href={link.path}
                      className="text-sm text-gray-400 hover:text-purple-400 transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8 bg-gray-800" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} InvertisPrep. All rights reserved.
          </p>

<div className="text-sm text-gray-400">
  <p className="flex items-center flex-wrap justify-center gap-x-1">
    <span>Made with</span>
    <span className="heart-icon">❤️</span>
    <span>by</span>
    <a
      href="https://www.ahqafali.dev"
      target="_blank"
      rel="noopener noreferrer"
      className="text-purple-400 hover:text-purple-300 transition-colors"
    >
      Ahqaf Ali
    </a>
    <span className="text-purple-400">&amp;</span>
    <a
      href="/our-team"
      target="_blank"
      rel="noopener noreferrer"
      className="text-purple-400 hover:text-purple-300 transition-colors"
    >
      TEAM
    </a>
  </p>
</div>

        </div>
      </div>

      {/* Mobile Footer */}
      <div className="sm:hidden px-4 py-6">
        <Accordion type="single" collapsible className="w-full">
          {Object.entries(footerLinks).map(([title, links]) => (
            <AccordionItem key={title} value={title} className="border-gray-800">
              <AccordionTrigger className="text-sm font-semibold text-gray-200 hover:text-gray-100">
                {title}
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 py-2">
                  {links.map((link) => (
                    <li key={`${title}-${link.name}-${link.path}`}>
                      <Link
                        href={link.path}
                        className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <Separator className="my-6 bg-gray-800" />

        <div className="flex flex-col space-y-3">
          <p className="text-sm text-gray-400 text-center">
            © {new Date().getFullYear()} InvertisPrep. All rights reserved.
          </p>
          <p className="text-sm text-gray-400 flex items-center justify-center flex-wrap gap-x-1">
            <span>Made with</span>
            <span className="heart-icon">❤️</span>
            <span>by</span>
            <a
              href="https://www.ahqafali.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Ahqaf Ali
            </a>
            <span className="text-purple-400">&amp;</span>
            <a
              href="/our-team"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              TEAM
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}