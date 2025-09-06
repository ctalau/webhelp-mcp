export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>WebHelp Search MCP</h1>
      <p>
        This service exposes a Model Context Protocol (MCP) server for any
        Oxygen WebHelp deployment. To create a server URL, append the WebHelp
        site's domain and path to this service's base URL.
      </p>
      <h2>Build your MCP server URL</h2>
      <ol>
        <li>
          Locate the root URL of your WebHelp documentation. Example:
          <code> https://www.oxygenxml.com/doc/versions/27.1/ug-editor/ </code>
        </li>
        <li>Remove the protocol prefix (e.g. "https://").</li>
        <li>
          Append the remaining part to the base MCP URL:
          <code> https://webhelp-mcp.vercel.app/</code>
        </li>
      </ol>
      <p>
        Following the steps above, the MCP server endpoint for the Oxygen XML
        Editor manual becomes:
      </p>
      <p>
        <code>
          https://webhelp-mcp.vercel.app/www.oxygenxml.com/doc/versions/27.1/ug-editor/
        </code>
      </p>
      <p>
        Use this URL with your MCP client or CLI tools to query the
        documentation. See the README for more details.
      </p>
    </main>
  );
}
