import Script from "next/script";

export default function Home() {
  return (
    <>
      <div id="particles-js"></div>
      <div className="container">
        <header>
          <div className="logo">WebHelp MCP</div>
          <div className="tagline">Connect your Oxygen WebHelp documentation to AI assistants</div>
        </header>

        <section className="hero">
          <h1>Model Context Protocol for WebHelp</h1>
          <p className="description">
            This service exposes a Model Context Protocol (MCP) server for any public Oxygen WebHelp deployment. 
            Transform your documentation into an intelligent resource for AI assistants.
          </p>
        </section>

        <section className="card">
          <h2><i>⚡</i> How It Works</h2>

          <div className="step">
            <span className="step-number">1</span>
            <strong>Locate your WebHelp URL</strong>
            <p>Find the root URL of your WebHelp documentation (e.g., https://www.oxygenxml.com/doc/versions/27.1/ug-editor/)</p>
          </div>

          <div className="step">
            <span className="step-number">2</span>
            <strong>Remove the protocol</strong>
            <p>Strip the "https://" or "http://" from the beginning of your URL</p>
          </div>

          <div className="step">
            <span className="step-number">3</span>
            <strong>Build your MCP server URL</strong>
            <p>Append your WebHelp path to our base MCP URL</p>
          </div>

          <div className="url-builder">
            <h3>URL Builder</h3>

            <div className="input-group">
              <label htmlFor="webhelp-url">Enter your WebHelp URL</label>
              <input type="text" id="webhelp-url" placeholder="https://www.example.com/docs/" />
            </div>

            <div className="result" id="result">
              Your MCP server URL will appear here
            </div>

            <button className="btn" id="generate-btn">
              <i>🔗</i> Generate MCP URL
            </button>

            <button className="btn copy-btn" id="copy-btn" style={{ display: 'none' }}>
              <i>📋</i> Copy to Clipboard
            </button>
          </div>

          <div className="example">
            <h4>Example:</h4>
            <p>WebHelp URL: <code>https://www.oxygenxml.com/doc/versions/27.1/ug-editor/</code></p>
            <p>MCP Server URL: <code>https://webhelp-mcp-git-codex-add-home-page-for-1611af-ctalaus-projects.vercel.app/www.oxygenxml.com/doc/versions/27.1/ug-editor/</code></p>
          </div>
        </section>
      </div>

      <footer>
        <p>Powered by WebHelp MCP Service</p>
      </footer>

      <Script id="home-page-script" strategy="afterInteractive">{
        `document.addEventListener('DOMContentLoaded', function() {
            particlesJS('particles-js', {
                particles: {
                    number: { value: 80, density: { enable: true, value_area: 800 } },
                    color: { value: "#ffffff" },
                    shape: { type: "circle" },
                    opacity: { value: 0.5, random: true },
                    size: { value: 3, random: true },
                    line_linked: {
                        enable: true,
                        distance: 150,
                        color: "#ffffff",
                        opacity: 0.4,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: 2,
                        direction: "none",
                        random: true,
                        straight: false,
                        out_mode: "out",
                        bounce: false
                    }
                },
                interactivity: {
                    detect_on: "canvas",
                    events: {
                        onhover: { enable: true, mode: "grab" },
                        onclick: { enable: true, mode: "push" },
                        resize: true
                    }
                },
                retina_detect: true
            });

            document.getElementById('generate-btn')?.addEventListener('click', generateUrl);
            document.getElementById('webhelp-url')?.addEventListener('input', updateResult);
            document.getElementById('copy-btn')?.addEventListener('click', copyToClipboard);
        });

        function generateUrl() {
            const input = document.getElementById('webhelp-url');
            const webhelpUrl = (input instanceof HTMLInputElement ? input.value : '').trim();

            if (!webhelpUrl) {
                alert('Please enter a valid WebHelp URL');
                return;
            }

            let cleanedUrl = webhelpUrl.replace(/^https?:\\/\\//, '').replace(/\\/+$/, '');
            const baseUrl = 'https://webhelp-mcp-git-codex-add-home-page-for-1611af-ctalaus-projects.vercel.app/';
            const mcpUrl = baseUrl + cleanedUrl + '/';

            const resultElement = document.getElementById('result');
            if (resultElement) {
                resultElement.textContent = mcpUrl;
                (resultElement as HTMLElement).style.display = 'block';
            }

            const copyBtn = document.getElementById('copy-btn');
            if (copyBtn) {
                (copyBtn as HTMLElement).style.display = 'inline-flex';
            }
        }

        function updateResult() {
            const input = document.getElementById('webhelp-url');
            const webhelpUrl = (input instanceof HTMLInputElement ? input.value : '').trim();

            const resultElement = document.getElementById('result');
            const copyBtn = document.getElementById('copy-btn');

            if (webhelpUrl) {
                const baseUrl = 'https://webhelp-mcp-git-codex-add-home-page-for-1611af-ctalaus-projects.vercel.app/';
                let cleanedUrl = webhelpUrl.replace(/^https?:\\/\\//, '').replace(/\\/+$/, '');
                const mcpUrl = baseUrl + cleanedUrl + '/';
                if (resultElement) {
                    resultElement.textContent = mcpUrl;
                    (resultElement as HTMLElement).style.display = 'block';
                }
                if (copyBtn) {
                    (copyBtn as HTMLElement).style.display = 'inline-flex';
                }
            } else {
                if (resultElement) {
                    (resultElement as HTMLElement).style.display = 'none';
                }
                if (copyBtn) {
                    (copyBtn as HTMLElement).style.display = 'none';
                }
            }
        }

        function copyToClipboard() {
            const resultElement = document.getElementById('result');
            const resultText = resultElement?.textContent || '';

            navigator.clipboard.writeText(resultText).then(() => {
                const copyBtn = document.getElementById('copy-btn');
                if (!copyBtn) return;
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i>✓</i> Copied!';

                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        }
        `}
      </Script>

      <style>{`
        :root {
            --primary: #6366f1;
            --primary-dark: #4f46e5;
            --secondary: #10b981;
            --dark: #1f2937;
            --light: #f9fafb;
            --gray: #6b7280;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: var(--light);
            line-height: 1.6;
            min-height: 100vh;
            position: relative;
        }
        #particles-js {
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: -1;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            z-index: 10;
            position: relative;
        }
        header {
            text-align: center;
            margin-bottom: 3rem;
            padding-top: 2rem;
        }
        .logo {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            background: linear-gradient(45deg, #fbbf24, #f59e0b);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            display: inline-block;
        }
        .tagline {
            font-size: 1.2rem;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 1rem;
        }
        .hero {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 1rem;
            padding: 2.5rem;
            margin-bottom: 3rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1.5rem;
            font-weight: 700;
        }
        .description {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            color: rgba(255, 255, 255, 0.9);
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 1rem;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        h2 {
            font-size: 1.8rem;
            margin-bottom: 1.5rem;
            color: white;
            display: flex;
            align-items: center;
        }
        h2 i {
            margin-right: 0.75rem;
            color: var(--secondary);
        }
        .step {
            margin-bottom: 1.5rem;
            padding: 1.5rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 0.75rem;
            transition: all 0.3s ease;
        }
        .step:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 20px rgba(0, 0, 0, 0.2);
        }
        .step-number {
            display: inline-flex;
            width: 32px;
            height: 32px;
            background: var(--primary);
            color: white;
            border-radius: 50%;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            margin-right: 0.75rem;
        }
        .url-builder {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-top: 2rem;
        }
        .input-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        label {
            font-weight: 500;
            font-size: 0.9rem;
        }
        input {
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(0, 0, 0, 0.3);
            color: white;
            font-family: inherit;
            transition: all 0.3s ease;
        }
        input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
        }
        .result {
            margin-top: 1.5rem;
            padding: 1.25rem;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 0.5rem;
            font-family: monospace;
            word-break: break-all;
            font-size: 0.95rem;
            display: none;
        }
        .btn {
            background: var(--primary);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .btn:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
        }
        .btn i {
            margin-right: 0.5rem;
        }
        .copy-btn {
            margin-top: 1rem;
            background: var(--secondary);
        }
        .copy-btn:hover {
            background: #059669;
        }
        .example {
            margin-top: 2rem;
            padding: 1.5rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 0.75rem;
        }
        footer {
            text-align: center;
            margin-top: 4rem;
            padding: 2rem 0;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
        }
        @media (max-width: 768px) {
            .container {
                padding: 1.5rem;
            }
            h1 {
                font-size: 2rem;
            }
            .hero {
                padding: 1.5rem;
            }
            .card {
                padding: 1.5rem;
            }
        }
      `}</style>
    </>
  );
}

