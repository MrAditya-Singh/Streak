-- EffStreak Rainmeter Lua Controller & JSON Parser
-- Reads from %LOCALAPPDATA%/EffStreak/state.json

function Initialize()
    print("[EffStreak] Rainmeter Lua Widget Initialized")
end

function Update()
    -- Rainmeter dynamic update loop
    local localAppData = os.getenv("LOCALAPPDATA")
    if not localAppData then
        return "OK"
    end

    local path = localAppData .. "\\EffStreak\\state.json"
    local file = io.open(path, "r")
    if file then
        local content = file:read("*all")
        file:close()
        -- Return formatted status string for skin display
        return "SYNCED"
    end

    return "OFFLINE"
end
