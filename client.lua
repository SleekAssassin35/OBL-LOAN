local QBCore = exports['qb-core']:GetCoreObject()
local creditZone = vector3(-69.19, -802.04, 44.0) -- Örnek koordinat, istediğin yeri ayarla

-- Bölge kontrolü
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(0) -- 500ms bekleme, optimize için
        local playerPed = PlayerPedId()
        local coords = GetEntityCoords(playerPed)
        local distance = #(coords - creditZone)
        
        if distance < 10.0 then
            if distance < 5.0 then
                DrawText3D(creditZone.x, creditZone.y, creditZone.z, "[E] Kredi Başvurusu Yap")
                if IsControlJustPressed(0, 38) then -- E tuşu
                    TriggerEvent('dr:openCreditUI')
                end
            end
            Citizen.Wait(0) -- Yakınken daha sık kontrol
        else
            Citizen.Wait(0) -- Uzakken daha az kontrol
        end
    end
end)

-- UI Açma
RegisterNetEvent('dr:openCreditUI')
AddEventHandler('dr:openCreditUI', function()
    SetNuiFocus(true, true)
    SendNUIMessage({ action = "show" })
end)

-- NUI Callback'leri
RegisterNUICallback('submitStep1', function(data, cb)
    SendNUIMessage({ action = "showStep2", data = data })
    cb('ok')
end)

RegisterNUICallback('submitStep2', function(data, cb)
    local amount = tonumber(data.amount)
    local term = tonumber(data.term)
    local interest = math.floor(amount * 0.01 * term) -- Günlük %1 faiz
    local totalRepayment = amount + interest

    SendNUIMessage({
        action = "showSummary",
        data = {
            step1 = data.step1,
            step2 = data,
            amount = amount,
            interest = interest,
            totalRepayment = totalRepayment
        }
    })
    cb('ok')
end)

RegisterNUICallback('showVehicleMortgage', function(data, cb)
    SendNUIMessage({ action = "showVehicleMortgage", data = data })
    cb('ok')
end)

RegisterNUICallback('submitVehicleMortgage', function(data, cb)
    local amount = tonumber(data.step2.amount) * 2 -- Araç ipotek ile iki katına çıkar
    local term = tonumber(data.step2.term)
    local interest = math.floor(amount * 0.01 * term) -- Günlük %1 faiz
    local totalRepayment = amount + interest

    SendNUIMessage({
        action = "showSummary",
        data = {
            step1 = data.step1,
            step2 = {
                amount = amount,
                term = term
            },
            amount = amount,
            interest = interest,
            totalRepayment = totalRepayment,
            vehicles = data.vehicles
        }
    })
    cb('ok')
end)

RegisterNUICallback('approve', function(data, cb)
    SetNuiFocus(false, false)
    SendNUIMessage({ action = "hide" })
    data.status = "approved"
    TriggerServerEvent('dr:submitCreditApplication', data)
    cb('ok')
end)

RegisterNUICallback('cancel', function(data, cb)
    SetNuiFocus(false, false)
    SendNUIMessage({ action = "hide" })
    data.status = "cancelled"
    TriggerServerEvent('dr:submitCreditApplication', data)
    cb('ok')
end)

RegisterNUICallback('close', function(data, cb)
    SetNuiFocus(false, false)
    SendNUIMessage({ action = "hide" })
    cb('ok')
end)

-- 3D Text Çizimi
function DrawText3D(x, y, z, text)
    local onScreen, _x, _y = World3dToScreen2d(x, y, z)
    if onScreen then
        SetTextScale(0.35, 0.35)
        SetTextFont(4)
        SetTextProportional(1)
        SetTextColour(255, 255, 255, 215)
        SetTextEntry("STRING")
        SetTextCentre(1)
        AddTextComponentString(text)
        DrawText(_x, _y)
    end
end