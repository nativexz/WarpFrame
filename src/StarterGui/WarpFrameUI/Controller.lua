-- THIS IS A EXAMPLE.... btw

local Renderer = require(game.ReplicatedStorage.WrapFrame)
local imageLabel = script.Parent.ImageContainer
local staticButton = script.Parent.StaticButton
local gifButton = script.Parent.GifButton

imageLabel.AnchorPoint = Vector2.new(0.5, 0.5)
imageLabel.Position = UDim2.new(0.5, 0, 0.5, 0)
imageLabel.BackgroundTransparency = 1

local renderer = Renderer.new(imageLabel)

staticButton.MouseButton1Click:Connect(function()
	task.spawn(renderer.rq, renderer, {type = "sfw"})
end)

gifButton.MouseButton1Click:Connect(function()
	task.spawn(renderer.rq, renderer, {type = "gif"})
end)
