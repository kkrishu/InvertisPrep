"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Menu, 
  ChevronDown, 
  LogOut, 
  Home, 
  BookOpen, 
  ExternalLink,
  Medal,
  User,
  Users,
  LayoutDashboard,
  TrendingUp,
  Wallet,
  UploadCloud
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Hide navbar on view pages
  if (pathname && (pathname.includes('/view/') || pathname.startsWith('/view/'))) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Silent error handling
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: <Home className="h-4 w-4 mr-2" /> },
    { name: 'Syllabus', path: '/resources/syllabus', icon: <BookOpen className="h-4 w-4 mr-2" /> },
    { name: 'PYQ', path: '/pyq', icon: <BookOpen className="h-4 w-4 mr-2" /> },
    { name: 'Quizzo', path: '/quizz0', icon: <BookOpen className="h-4 w-4 mr-2" /> },
    { name: 'Contact', path: '/contact', icon: <BookOpen className="h-4 w-4 mr-2" /> },
  ];

  // Format user name for display
  const formatDisplayName = () => {
    if (!user) return '';
    return user.email?.split('@')[0] || '';
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                INVERTISPREP <span className="text-sm">v2</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links - Centered */}
          <div className="hidden sm:flex flex-1 justify-center items-center">
            <NavigationMenu>
              <NavigationMenuList>
                {navLinks.map((link) => (
                  <NavigationMenuItem key={link.path}>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                      <Link href={link.path}>
                        {link.name}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
                
                {/* Leaderboard - Coming Soon */}
                <NavigationMenuItem>
                  <button disabled>
                    <NavigationMenuLink className="group h-10 flex items-center justify-center relative px-4 py-2 rounded-md border-none bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium shadow-md hover:shadow-lg transition-all opacity-75 cursor-not-allowed">
                      <Medal className="h-4 w-4 mr-1.5" />
                      <span>Leaderboard</span>
                      <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                        SOON
                      </div>
                    </NavigationMenuLink>
                  </button>
                </NavigationMenuItem>
                
                {/* More Dropdown */}
                <NavigationMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={navigationMenuTriggerStyle()}>
                        More <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/our-team" className="w-full">Our Team</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/about" className="w-full">About</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/report-bug" className="w-full">Report Bug</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/privacy-policy" className="w-full">Privacy Policy</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/terms-of-service" className="w-full">Terms of Service</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Mobile menu button - Sheet */}
          {isMounted && (
            <div className="sm:hidden flex items-center">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="default"
                    className="inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                  <div className="h-full flex flex-col">
                    {/* User Profile Section at Top */}
                    <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
                      {user ? (
                        <div className="flex flex-col items-center">
                          <Avatar className="h-16 w-16 mb-3 ring-2 ring-white shadow-md">
                            {user.picture && (
                              <AvatarImage src={user.picture} alt={user.name || 'User'} className="object-cover" />
                            )}
                            <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-400 text-white text-lg">
                              {user.name ? getInitials(user.name) : (user.email ? getInitials(user.email) : 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-center">
                            <p className="font-bold text-lg text-gray-800 leading-tight">{user.name || formatDisplayName()}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px] mb-1">{user.email}</p>
                            <p className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{user.role}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-4">
                          <SheetHeader>
                            <SheetTitle className="text-center">Welcome to InvertisPrep</SheetTitle>
                          </SheetHeader>
                          <div className="w-full space-y-2">
                            <Link href="/login" className="w-full" onClick={() => setOpen(false)}>
                              <Button className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Sign In with Google</Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Navigation Links */}
                    <div className="flex-1 overflow-auto py-2">
                      {/* Main Nav Links */}
                      <div className="space-y-1 px-2">
                        {navLinks.map((link) => (
                          <Link
                            key={link.path}
                            href={link.path}
                            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                            onClick={() => setOpen(false)}
                          >
                            {link.icon}
                            {link.name}
                          </Link>
                        ))}

                        {/* Our Team */}
                        <Link
                          href="/our-team"
                          className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                          onClick={() => setOpen(false)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Our Team
                        </Link>
                        
                        {/* Leaderboard - Coming Soon Mobile */}
                        <button
                          disabled
                          className="w-full flex items-center px-3 py-2 my-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-75 cursor-not-allowed shadow-sm relative"
                        >
                          <Medal className="h-4 w-4 mr-2" />
                          Leaderboard
                          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                            SOON
                          </span>
                        </button>
                        
                        {/* Student / User Links (when logged in) */}
                        {user && (
                          <>
                            <Separator className="my-2" />
                            <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              My Account
                            </p>
                            <div className="space-y-1">
                              <Link
                                href="/profile"
                                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                onClick={() => setOpen(false)}
                              >
                                <User className="h-4 w-4 mr-2 text-gray-500" />
                                Profile
                              </Link>
                              <Link
                                href="/pyq/upload"
                                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                onClick={() => setOpen(false)}
                              >
                                <UploadCloud className="h-4 w-4 mr-2 text-gray-500" />
                                Upload PYQ
                              </Link>
                              <Link
                                href={user.role === 'admin' || user.role === 'super-admin' ? '/admin/dashboard' : '/dashboard'}
                                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                onClick={() => setOpen(false)}
                              >
                                <LayoutDashboard className="h-4 w-4 mr-2 text-gray-500" />
                                Dashboard
                              </Link>
                              <Link
                                href="/academic-progress"
                                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                onClick={() => setOpen(false)}
                              >
                                <TrendingUp className="h-4 w-4 mr-2 text-gray-500" />
                                Academic Progress
                              </Link>
                              <Link
                                href="/qc-wallet"
                                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                onClick={() => setOpen(false)}
                              >
                                <Wallet className="h-4 w-4 mr-2 text-gray-500" />
                                QC Wallet
                              </Link>
                            </div>
                          </>
                        )}
                        
                        {/* Admin Menu Links (when logged in as admin) */}
                        {user && (user.role === 'admin' || user.role === 'super-admin') && (
                          <>
                            <Separator className="my-2" />
                            <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Admin
                            </p>
                            <div className="space-y-1">
                              <Link
                                href="/admin/departments"
                                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                onClick={() => setOpen(false)}
                              >
                                <Home className="h-4 w-4 mr-2" />
                                Departments
                              </Link>
                              <Link
                                href="/admin/branches"
                                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                onClick={() => setOpen(false)}
                              >
                                <BookOpen className="h-4 w-4 mr-2" />
                                Branches
                              </Link>
                              <Link
                                href="/admin/sessions"
                                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                onClick={() => setOpen(false)}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Sessions
                              </Link>
                              <Link
                                href="/admin/upload"
                                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                onClick={() => setOpen(false)}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Upload PYQ
                              </Link>
                              <Link
                                href="/admin/papers"
                                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                onClick={() => setOpen(false)}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Manage Papers
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Logout Button at Bottom */}
                    {user && (
                      <div className="p-4 border-t border-gray-200">
                        <Button 
                          variant="outline" 
                          className="w-full flex items-center justify-center" 
                          onClick={() => {
                            handleLogout();
                            setOpen(false);
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Log out
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}

          {/* Styled User Box (Desktop) */}
          <div className="hidden sm:flex sm:items-center">
            {isMounted && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-purple-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <Avatar className="h-7 w-7 ring-1 ring-purple-200">
                      {user.picture && (
                        <AvatarImage src={user.picture} alt={user.name || 'User'} className="object-cover" />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-400 text-white text-xs">
                        {user.name ? getInitials(user.name) : (user.email ? getInitials(user.email) : 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-700">{user.name ? user.name.split(' ')[0] : formatDisplayName()}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center space-x-2 p-2">
                    <Avatar className="h-9 w-9 ring-1 ring-purple-200">
                      {user.picture && (
                        <AvatarImage src={user.picture} alt={user.name || 'User'} className="object-cover" />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-400 text-white text-xs">
                        {user.name ? getInitials(user.name) : (user.email ? getInitials(user.email) : 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5">
                      <span className="font-semibold text-sm text-gray-800 leading-tight">{user.name || formatDisplayName()}</span>
                      <span className="text-xs text-gray-500 truncate max-w-[150px]">{user.email}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/pyq/upload" className="w-full flex items-center">
                      <UploadCloud className="h-4 w-4 mr-2 text-gray-500" />
                      Upload PYQ
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link 
                      href={user.role === 'admin' || user.role === 'super-admin' ? '/admin/dashboard' : '/dashboard'} 
                      className="w-full flex items-center"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2 text-gray-500" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/academic-progress" className="w-full flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-gray-500" />
                      Academic Progress
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/qc-wallet" className="w-full flex items-center">
                      <Wallet className="h-4 w-4 mr-2 text-gray-500" />
                      QC Wallet
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {(user.role === 'admin' || user.role === 'super-admin') && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/departments" className="w-full flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                          Departments
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/branches" className="w-full flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                          Branches
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/sessions" className="w-full flex items-center">
                          <ExternalLink className="h-4 w-4 mr-2 text-gray-500" />
                          Sessions
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/upload" className="w-full flex items-center">
                          <ExternalLink className="h-4 w-4 mr-2 text-gray-500" />
                          Upload PYQ
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/papers" className="w-full flex items-center">
                          <ExternalLink className="h-4 w-4 mr-2 text-gray-500" />
                          Manage Papers
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50 focus:text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isMounted ? (
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 shadow-md">
                    Sign In
                  </Button>
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}