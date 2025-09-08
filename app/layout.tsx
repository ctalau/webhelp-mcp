import React from 'react';

export const metadata = {
  title: "MCP WebHelp Server - Documentation Made Beautiful",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
        tailwind.config = {
          theme: {
            extend: {
              animation: {
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'slide-up': 'slideUp 0.8s ease-out',
                'fade-in': 'fadeIn 1s ease-out'
              },
              keyframes: {
                float: {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-20px)' }
                },
                glow: {
                  '0%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
                  '100%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.8)' }
                },
                slideUp: {
                  '0%': { transform: 'translateY(50px)', opacity: '0' },
                  '100%': { transform: 'translateY(0)', opacity: '1' }
                },
                fadeIn: {
                  '0%': { opacity: '0' },
                  '100%': { opacity: '1' }
                }
              }
            }
          }
        }
      `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .glass-effect {
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            opacity: 0;
        }
        .glass-effect.animate-fade-in {
            opacity: 1;
        }
        .code-block {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            border-left: 4px solid #3b82f6;
        }
        .step-number {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        }
        .hero-pattern {
            background-image: radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2px, transparent 0);
            background-size: 50px 50px;
        }
      `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

