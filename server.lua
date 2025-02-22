local QBCore = exports['qb-core']:GetCoreObject()

-- Discord Webhook URL'leri (server.cfg veya burada tanımla)
local webhookApproved = "https://discord.com/api/webhooks/1183883597741043772/x56rdcPg1JZQxh8kUndb3V503_Tx7ZRq9i3ObxfJhllUXtyWPig4XH_gTnsYQ3wqSG5K" -- Onaylanan krediler
local webhookCancelled = "https://discord.com/api/webhooks/1134572630595354694/VhLzqDNHoP68B997roLBx3GNUnpaEz-MqgBTPdNSEZMiWqpi-SgLQFjlTNM6Q9egnTkn" -- İptal edilen krediler

-- Webhook gönderme fonksiyonu
local function sendToDiscord(webhook, title, description, color)
    local embed = {
        {
            ["title"] = title,
            ["description"] = description,
            ["color"] = color,
            ["timestamp"] = os.date("!%Y-%m-%dT%H:%M:%SZ")
        }
    }
    PerformHttpRequest(webhook, function(err, text, headers) end, 'POST', json.encode({embeds = embed}), { ['Content-Type'] = 'application/json' })
end

-- Kredi başvuru loglama
RegisterNetEvent('dr:submitCreditApplication')
AddEventHandler('dr:submitCreditApplication', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    local citizenid = Player.PlayerData.citizenid
    local name = Player.PlayerData.charinfo.firstname .. " " .. Player.PlayerData.charinfo.lastname
    local bankMoney = Player.Functions.GetMoney('bank')

    local logMessage = string.format(
        "**Oyuncu:** %s (CitizenID: %s)\n" ..
        "**Mevcut Banka Parası:** %s $\n" ..
        "----------------------------------------\n" ..
        "**Meslek:** %s\n" ..
        "**Meslek Rütbesi:** %s\n" ..
        "**Araç Var mı:** %s\n" ..
        "**Ev Var mı:** %s\n" ..
        "**Aylık Tahmini Gelir:** %s\n" ..
        "**Kredi Amaç:** %s\n" ..
        "**Kayıtlı İş Yeri Var mı:** %s\n" ..
        "**Kefil İsim-Soyisim:** %s\n" ..
        "**Kefil Telefon Numarası:** %s\n" ..
        "**Kredi Türü:** %s\n" ..
        "**Miktar:** %s\n" ..
        "**Vade:** %s gün\n" ..
        "**Faiz:** %s (Günlük %%1)\n" ..
        "**Toplam Geri Ödeme:** %s\n" ..
        "**İpotek Edilen Araçlar:** %s",
        name, citizenid, bankMoney,
        data.job or "Bilgi yok", data.jobRank or "Yok",
        data.hasVehicle or "Hayır", data.hasHouse or "Hayır",
        data.income or "Bilgi yok", data.purpose or "Bilgi yok",
        data.hasBusiness or "Hayır", data.guarantorName or "Belirtilmemiş", data.guarantorPhone or "Belirtilmemiş",
        data.creditType or "Belirtilmemiş", data.amount or "0", data.term or "0",
        data.interest or "0", data.totalRepayment or "0", (data.vehicles and table.concat(data.vehicles, ", ") or "Yok")
    )

    if data.status == "approved" then
        sendToDiscord(webhookApproved, "Yeni Kredi Başvurusu Onaylandı", logMessage, 65280) -- Yeşil
        -- Burada oyuncuya mesaj göster
        TriggerClientEvent('QBCore:Notify', src, "Krediniz onay aşamasında. UTC 24 saat içerisinde tarafınıza telefon ve mail aracılığı ile olumlu veya olumsuz dönüş yapılacaktır. Araç ipotek ettirdiyseniz, yeni teklif 24 saat içerisinde tarafınıza sunulacaktır.", "success")
    elseif data.status == "cancelled" then
        sendToDiscord(webhookCancelled, "Kredi Başvurusu İptal Edildi", logMessage, 16711680) -- Kırmızı
    end
end)

-- Banka bakiyesini getir
QBCore.Functions.CreateCallback('dr:getBankBalance', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if Player then
        cb({ balance = Player.Functions.GetMoney('bank') or 0 })
    else
        cb({ balance = 0 })
    end
end)

-- Oyuncunun araçlarını getir
QBCore.Functions.CreateCallback('dr:getVehicles', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if Player then
        local vehicles = {}
        local citizenid = Player.PlayerData.citizenid
        MySQL.Async.fetchAll('SELECT plate, vehicle FROM player_vehicles WHERE citizenid = ?', { citizenid }, function(result)
            for _, v in pairs(result) do
                table.insert(vehicles, { plate = v.plate, model = v.vehicle })
            end
            cb({ vehicles = vehicles })
        end)
    else
        cb({ vehicles = {} })
    end
end)