# WarpFrame

WarpFrame is a high-performance rendering engine that warps web images and animated GIFs directly into your Roblox experience.

Built for speed and reliability, it features server-side caching and a unique pre-loading system for perfectly smooth, lag-free GIF playback.

### Core Features

-   **Dual Format Support:** Flawlessly renders both static images (PNG/JPG) and animated GIFs.
-   **Optimized for Performance:** Server-side caching and image resizing minimize bandwidth and ensure speed.
-   **Smooth GIF Playback:** All GIF frames are pre-loaded to the client for a seamless animation loop.
-   **Simple API:** Integrate into any project with just a few lines of code.

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

1.  Import `roblox/WarpFrame.rbxmx` into Roblox Studio.
2.  In **Game Settings > Security**, enable `Allow HTTP Requests`.
3.  In **File > Beta Features**, enable `EditableImage and EditableMesh` and **restart Studio**.

### Usage Example

```lua
-- In a LocalScript controlling your UI
local WarpFrame = require(game.ReplicatedStorage.WarpFrame)
local imageLabel = script.Parent.ImageContainer

local renderer = WarpFrame.new(imageLabel)

-- Request a static image
task.spawn(renderer.request, renderer, {type = "sfw"})

-- Request a GIF
task.spawn(renderer.request, renderer, {type = "gif"})
```
