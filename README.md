# WarpFrame

WarpFrame is a high-performance rendering engine that warps web images and animated GIFs directly into your Roblox experience.

Built for reliability, it features server-side caching and a unique pre-loading system for perfectly smooth, lag-free GIF playback once loaded.

## Disclaimer of Liability
“**WarpFrame** is provided “as is,” without warranty of any kind. The author and contributors disclaim all liability for any damages or losses arising from the use or misuse of this system. Users assume all responsibility for compliance with platform rules and regulations. By integrating **WarpFrame**, you agree that the author is not responsible for any content created, displayed, or distributed through this system.”

## Educational Purpose Notice

**WarpFrame** is provided solely for **educational purposes** to demonstrate how to render external images and GIFs within a Roblox experience. It is not intended for production use or to facilitate any violations of platform policies.

## Core Features

-   **Dual Format Support:** Flawlessly renders both static images (PNG/JPG) and animated GIFs.
-   **Smooth GIF Playback:** All GIF frames are pre-loaded to the client for a seamless animation loop.
-   **Resilient Networking:** A retry mechanism for chunk/frame loading ensures reliability over unstable connections.
-   **Simple API:** Integrate into any project with just a few lines of code.

### Performance Benchmark

WarpFrame is designed for reliability. Performance will vary based on server and client hardware. To set clear expectations, here is a baseline test on older hardware:

-   **CPU:** AMD Athlon @ 2.9GHz
-   **GPU:** GeForce GT 220
-   **RAM:** 4GB
-   **Result:** `~1 minute` to pre-load a 59-frame GIF.

*Future optimizations to the client-side decoding process are planned to improve these pre-load times.*

### Quick Setup

#### 1. Server

Requires Node.js. In your terminal, navigate to the `server` directory and run:

```bash
# Install dependencies
npm install

# Run the server
node s.js
```

#### 2. Roblox

1.  Place the scripts from the `src` folder into their corresponding services in Roblox Studio (`ReplicatedStorage`, `ServerScriptService`, etc.).
2. In **ReplicatedStorage**:
   - Create a **Folder** and name it **Events**.
   - Inside the **Events** folder, add two **RemoteFunction** instances:
     1. **GetData**
     2. **InitImg**
3.  In **Game Settings > Security**, enable `Allow HTTP Requests`.
4.  In **File > Beta Features**, enable `EditableImage and EditableMesh` and **restart Studio**.

### Usage Example

```lua
-- In StarterGui/WarpFrameUI/Controller.lua
local WarpFrame = require(game.ReplicatedStorage.WarpFrame)
local imageLabel = script.Parent.ImageContainer

local renderer = WarpFrame.new(imageLabel)

-- Connect to your buttons to call the request function
-- task.spawn(renderer.request, renderer, {type = "gif"})
```
