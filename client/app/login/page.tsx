"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef, useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handledCallbackRef = useRef(false);
  const router = useRouter();
  const { login, updateUser } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [mode, setMode] = useState<'student' | 'admin'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isWebViewAuthFlow, setIsWebViewAuthFlow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setIsWebViewAuthFlow(params.get('webview') === '1' || params.get('mobile') === '1');
  }, []);

  // Handle URL parameters safely on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('role') === 'admin' || params.get('mode') === 'admin') {
        setMode('admin');
      }
    }
  }, []);

  // Handle checking for NextAuth session on mount (to handle OAuth callback redirect)
  useEffect(() => {
    if (handledCallbackRef.current) {
      return;
    }

    const handleGoogleCallback = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const session = await res.json();

        if (session?.idToken) {
          setLoading(true);
          setError('');

          // Send the ID token to our backend
          const response = await api.post('/auth/google-login', {
            token: session.idToken
          });

          if (response.data?.success && response.data?.token) {
            // Call NextAuth signout to clear the NextAuth session so it doesn't linger
            await signOut({ redirect: false });

            handledCallbackRef.current = true;

            // Keep the web app auth state in sync before the native app consumes the deep link.
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            updateUser(response.data.user);

            if (isWebViewAuthFlow && typeof window !== 'undefined') {
              const callbackUrl = new URL('invertisprep://auth/callback');
              callbackUrl.searchParams.set('token', response.data.token);

              // Pass the user object to the native app so it can write both
              // `token` AND `user` into the WebView's localStorage (AuthContext
              // requires both). Encode as base64 of UTF-8 bytes to stay
              // URL-safe and unicode-safe (btoa() is ASCII-only).
              const userJson = JSON.stringify(response.data.user);
              const userB64 = btoa(
                encodeURIComponent(userJson).replace(
                  /%([0-9A-F]{2})/g,
                  (_, p) => String.fromCharCode(parseInt(p, 16))
                )
              );
              callbackUrl.searchParams.set('user', userB64);

              window.location.replace(callbackUrl.toString());
              return;
            }

            // Redirect to PYQ page
            router.push('/pyq');
          } else {
            setError(response.data?.message || 'Failed to authenticate with server');
            setLoading(false);
          }
        }
      } catch {
        setError('An error occurred while finishing Google sign-in.');
        setLoading(false);
      }
    };

    handleGoogleCallback();
  }, [isWebViewAuthFlow, router, updateUser]);

  // Social sign-in handlers
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signIn('google', {
        callbackUrl: isWebViewAuthFlow ? '/login?webview=1' : '/login'
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred during Google login';
      setError(errorMsg);
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signIn('github', {
        callbackUrl: isWebViewAuthFlow ? '/login?webview=1' : '/login'
      });
    } catch {
      setError('GitHub sign-in is not configured yet. Please continue with Google.');
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signIn('apple', {
        callbackUrl: isWebViewAuthFlow ? '/login?webview=1' : '/login'
      });
    } catch {
      setError('Mac/Apple sign-in is not configured yet. Please continue with Google.');
      setLoading(false);
    }
  };

  // Student Email Submission Warning
  const handleStudentEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("Email sign-in is currently available only for Team Admin accounts. Students must login using Google.");
  };

  // Admin Login Submission
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ThreeJS Dynamic Interactive Background
  useEffect(() => {
    let active = true;
    let renderer: any;
    let geometry: any;
    let material: any;
    let scene: any;
    let camera: any;
    let animationId: number;
    let cleanUpResize: (() => void) | undefined;

    const initThree = (THREE: any) => {
      if (!canvasRef.current || !active) return;
      const canvas = canvasRef.current;
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const uniforms = {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth * 2, window.innerHeight * 2) },
        u_mouse: { value: new THREE.Vector2(-999.0, -999.0) }, // off-screen initially
        u_opacities: { value: [0.12, 0.12, 0.16, 0.20, 0.24, 0.28, 0.32, 0.36, 0.40, 0.45] },
        u_colors: {
          value: [
            new THREE.Vector3(0.39, 0.45, 0.95), // Indigo
            new THREE.Vector3(0.58, 0.31, 0.89), // Violet
            new THREE.Vector3(0.12, 0.74, 0.74), // Teal
            new THREE.Vector3(0.47, 0.55, 0.63), // Slate gray
            new THREE.Vector3(0.93, 0.39, 0.58), // Rose
            new THREE.Vector3(0.3, 0.5, 0.9)    // Blue
          ]
        },
        u_total_size: { value: 24.0 },
        u_dot_size: { value: 5.0 },
        u_reverse: { value: 0 }
      };

      material = new THREE.ShaderMaterial({
        vertexShader: `
          precision mediump float;
          uniform vec2 u_resolution;
          out vec2 fragCoord;
          void main() {
            gl_Position = vec4(position, 1.0);
            fragCoord = (position.xy + 1.0) * 0.5 * u_resolution;
            fragCoord.y = u_resolution.y - fragCoord.y;
          }
        `,
        fragmentShader: `
          precision mediump float;
          in vec2 fragCoord;

          uniform float u_time;
          uniform float u_opacities[10];
          uniform vec3 u_colors[6];
          uniform float u_total_size;
          uniform float u_dot_size;
          uniform vec2 u_resolution;
          uniform vec2 u_mouse;
          uniform int u_reverse;

          out vec4 fragColor;

          float PHI = 1.61803398874989484820459;
          float random(vec2 xy) {
              return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
          }

          void main() {
              vec2 st = fragCoord.xy;
              st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
              st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

              float opacity = step(0.0, st.x) * step(0.0, st.y);

              vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

              float frequency = 6.0;
              float show_offset = random(st2);
              float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
              opacity *= u_opacities[int(rand * 10.0)];
              opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
              opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

              vec3 color = u_colors[int(show_offset * 6.0)];

              float animation_speed_factor = 2.0;
              vec2 center_grid = u_resolution / 2.0 / u_total_size;
              float dist_from_center = distance(center_grid, st2);

              float timing_offset_intro = dist_from_center * 0.008 + (random(st2) * 0.12);

              float current_timing_offset = timing_offset_intro;
              opacity *= step(current_timing_offset, u_time * animation_speed_factor);
              opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);

              // Mouse interaction: dots near cursor glow brighter
              vec2 mouse_grid = u_mouse / u_total_size;
              float dist_from_mouse = distance(mouse_grid, st2);
              float mouse_radius = 6.0; // grid-cell radius of influence
              float mouse_strength = 1.0 - smoothstep(0.0, mouse_radius, dist_from_mouse);

              // Boost opacity and shift colour toward white near cursor
              opacity = mix(opacity, min(opacity * 3.5, 0.95), mouse_strength * 0.85);
              color = mix(color, vec3(0.55, 0.40, 1.0), mouse_strength * 0.5);

              fragColor = vec4(color, opacity);
              fragColor.rgb *= fragColor.a;
          }
        `,
        uniforms: uniforms,
        glslVersion: THREE.GLSL3,
        transparent: true
      });

      geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const startTime = performance.now();
      const animate = () => {
        if (!active) return;
        animationId = requestAnimationFrame(animate);
        uniforms.u_time.value = (performance.now() - startTime) / 1000.0;
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!active) return;
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.u_resolution.value.set(window.innerWidth * 2, window.innerHeight * 2);
      };
      window.addEventListener('resize', handleResize);

      // Smooth eased mouse tracking
      let targetMouseX = -999.0;
      let targetMouseY = -999.0;
      let currentMouseX = -999.0;
      let currentMouseY = -999.0;

      const handleMouseMove = (e: MouseEvent) => {
        targetMouseX = e.clientX * 2;  // match resolution scale (*2)
        targetMouseY = e.clientY * 2;
      };
      window.addEventListener('mousemove', handleMouseMove);

      // Override animate to include mouse easing
      cancelAnimationFrame(animationId);
      const easeAnimate = () => {
        if (!active) return;
        animationId = requestAnimationFrame(easeAnimate);
        uniforms.u_time.value = (performance.now() - startTime) / 1000.0;
        // Lerp toward target for smooth follow
        const ease = 0.06;
        currentMouseX += (targetMouseX - currentMouseX) * ease;
        currentMouseY += (targetMouseY - currentMouseY) * ease;
        uniforms.u_mouse.value.set(currentMouseX, currentMouseY);
        renderer.render(scene, camera);
      };
      easeAnimate();

      cleanUpResize = () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
      };
    };

    // Dynamically load Three.js via script tag to avoid bundler import errors
    if ((window as any).THREE) {
      initThree((window as any).THREE);
    } else {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      script.async = true;
      script.onload = () => {
        if ((window as any).THREE && active) {
          initThree((window as any).THREE);
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      active = false;
      if (cleanUpResize) cleanUpResize();
      if (animationId) cancelAnimationFrame(animationId);
      if (renderer) renderer.dispose();
      if (geometry) geometry.dispose();
      if (material) material.dispose();
    };
  }, []);

  /* ─── Google / GitHub / Apple SVGs ─── */
  const GoogleIcon = (
    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  const GitHubIcon = (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );

  const AppleIcon = (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.56.04 2.88.75 3.65 1.89-3.08 1.75-2.58 5.61.35 6.75-1.01 2.37-2.39 4.39-4.29 4.29zM12.03 7.25c-.15-2.23 1.66-4.07 3.72-4.25.36 2.38-1.92 4.34-3.72 4.25z" />
    </svg>
  );


  const Footer = (
    <div style={{ marginTop: "0.85rem", fontSize: "0.75rem", color: "#64748b", lineHeight: 1.5, textAlign: "center" }}>
      By proceeding, you agree to creating an account<br />subject to our{" "}
      <Link href="/terms-of-service" style={{ color: "#475569", fontWeight: 500, textDecoration: "underline" }}>Terms of Service</Link> and <Link href="/privacy-policy" style={{ color: "#475569", fontWeight: 500, textDecoration: "underline" }}>Privacy Policy</Link>.
    </div>
  );

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      color: "#0f172a",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* WebGL Dot Canvas */}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />

      {/* Light Theme Vignette Overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        background: "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(241,245,249,0.85) 100%)",
        pointerEvents: "none"
      }} />

      {/* Card Content Container */}
      <div style={{
        position: "relative",
        zIndex: 2,
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 16,
        padding: "2.25rem 2rem",
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02), 0 0 1px 1px rgba(0, 0, 0, 0.02)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        border: "1px solid rgba(226, 232, 240, 0.8)"
      }}>

        {/* Error notification display */}
        {error && (
          <div style={{
            width: "100%",
            padding: "0.75rem 1rem",
            backgroundColor: "#fef2f2",
            border: "1px solid #fee2e2",
            borderRadius: 8,
            color: "#b91c1c",
            fontSize: "0.825rem",
            marginBottom: "1rem",
            textAlign: "center",
            lineHeight: 1.4
          }}>
            {error}
          </div>
        )}

        {/* 1. STUDENT LOGIN MODE */}
        {mode === 'student' && (
          isLogin ? (
            <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <h1 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.25rem", color: "#0f172a", letterSpacing: "-0.025em" }}>Sign in to InvertisPrep</h1>
              <p style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "1.25rem", lineHeight: 1.5 }}>Access your academic study materials.</p>

              <form onSubmit={handleStudentEmailSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                <input
                  className="login-input"
                  type="email"
                  placeholder="name@work-email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                <button type="submit" className="login-button-primary" disabled={loading}>
                  Continue with Email
                </button>
              </form>

              <div style={{ height: 1, background: "#e2e8f0", width: "100%", margin: "1rem 0" }} />

              <button className="login-button-social" onClick={handleGoogleLogin} disabled={loading}>
                {GoogleIcon} Continue with Google
              </button>
              <button className="login-button-social" onClick={handleGitHubLogin} disabled={loading}>
                {GitHubIcon} Continue with GitHub
              </button>
              <button className="login-button-social" onClick={handleAppleLogin} disabled={loading}>
                {AppleIcon} Continue with Mac
              </button>

              <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#475569" }}>
                Don&apos;t have an account?{" "}
                <button onClick={() => setIsLogin(false)} style={{ color: "#0f172a", fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", textDecoration: "underline" }}>Sign Up</button>
              </div>

              <div style={{ height: 1, background: "#e2e8f0", width: "100%", margin: "1rem 0" }} />

              <button
                onClick={() => { setMode('admin'); setError(''); }}
                style={{ background: "none", border: "none", color: "#6366f1", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", transition: "color 0.2s" }}
              >
                Login as Team
              </button>

              {Footer}
            </div>
          ) : (
            <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <h1 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.25rem", color: "#0f172a", letterSpacing: "-0.025em" }}>Create an Account</h1>
              <p style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "1.25rem", lineHeight: 1.5 }}>Start preparing for academic excellence.</p>

              <form onSubmit={handleStudentEmailSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                <input
                  className="login-input"
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
                <input
                  className="login-input"
                  type="email"
                  placeholder="name@work-email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                <button type="submit" className="login-button-primary" disabled={loading}>
                  Sign Up with Email
                </button>
              </form>

              <div style={{ height: 1, background: "#e2e8f0", width: "100%", margin: "1rem 0" }} />

              <button className="login-button-social" onClick={handleGoogleLogin} disabled={loading}>
                {GoogleIcon} Sign up with Google
              </button>
              <button className="login-button-social" onClick={handleGitHubLogin} disabled={loading}>
                {GitHubIcon} Sign up with GitHub
              </button>
              <button className="login-button-social" onClick={handleAppleLogin} disabled={loading}>
                {AppleIcon} Sign up with Mac
              </button>

              <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#475569" }}>
                Already have an account?{" "}
                <button onClick={() => setIsLogin(true)} style={{ color: "#0f172a", fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", textDecoration: "underline" }}>Sign In</button>
              </div>

              <div style={{ height: 1, background: "#e2e8f0", width: "100%", margin: "1rem 0" }} />

              <button
                onClick={() => { setMode('admin'); setError(''); }}
                style={{ background: "none", border: "none", color: "#6366f1", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", transition: "color 0.2s" }}
              >
                Login as Team
              </button>

              {Footer}
            </div>
          )
        )}

        {/* 2. TEAM ADMIN LOGIN MODE */}
        {mode === 'admin' && (
          <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.25rem", color: "#0f172a", letterSpacing: "-0.025em" }}>Team Admin Sign In</h1>
            <p style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "1.25rem", lineHeight: 1.5 }}>Sign in to manage PYQ papers and dashboard.</p>

            <form onSubmit={handleAdminSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ width: "100%", textAlign: "left" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.35rem" }}>Email</label>
                <input
                  className="login-input"
                  type="email"
                  placeholder="superadmin@invertis.edu.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div style={{ width: "100%", textAlign: "left" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.35rem" }}>Password</label>
                <input
                  className="login-input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="login-button-primary" style={{ marginTop: "0.5rem" }} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In as Team'}
              </button>
            </form>

            <div style={{ height: 1, background: "#e2e8f0", width: "100%", margin: "1.25rem 0" }} />

            <button
              onClick={() => { setMode('student'); setError(''); }}
              style={{ background: "none", border: "none", color: "#6366f1", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", transition: "color 0.2s" }}
            >
              Back to Student Sign In
            </button>

            {Footer}
          </div>
        )}
      </div>

      {/* Styled Interactive Effects for Focus & Hover states without Tailwind */}
      <style jsx global>{`
        .login-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .login-input::placeholder {
          color: #94a3b8;
        }
        .login-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }
        .login-button-primary {
          width: 100%;
          padding: 0.75rem;
          border-radius: 8px;
          border: none;
          background: #0f172a;
          color: #ffffff;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .login-button-primary:hover {
          background: #1e293b;
        }
        .login-button-primary:active {
          background: #0f172a;
        }
        .login-button-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login-button-social {
          width: 100%;
          padding: 0.65rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #334155;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          transition: all 0.2s;
        }
        .login-button-social:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .login-button-social:active {
          background: #f1f5f9;
        }
        .login-button-social:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
