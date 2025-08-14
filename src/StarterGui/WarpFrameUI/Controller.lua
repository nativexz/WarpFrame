local WarpFrame = require(game.ReplicatedStorage.WarpFrame)
local imageLabel = script.Parent.ImageContainer
local staticButton = script.Parent.StaticButton
local gifButton = script.Parent.GifButton

imageLabel.AnchorPoint = Vector2.new(0.5, 0.5)
imageLabel.Position = UDim2.new(0.5, 0, 0.5, 0)
imageLabel.BackgroundTransparency = 1

local renderer = WarpFrame.new(imageLabel)

staticButton.MouseButton1Click:Connect(function()
	task.spawn(renderer.request, renderer, {type = "sfw"})
end)

gifButton.MouseButton1Click:Connect(function()
	task.spawn(renderer.request, renderer, {type = "gif"})
end)
