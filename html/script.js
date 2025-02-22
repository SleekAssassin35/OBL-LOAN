/* global GetParentResourceName */ // Editörde kırmızı hata çıkmasını önler
let step1Data = {};
let step2Data = {};
let bankBalance = 0;
let vehicles = [];

window.addEventListener('message', function(event) {
    const data = event.data;

    if (data.action === "show") {
        document.getElementById("container").style.display = "block";
        document.getElementById("step1").style.display = "block";
        document.getElementById("step2").style.display = "none";
        document.getElementById("summary").style.display = "none";
        document.getElementById("vehicleMortgage").style.display = "none";
        fetchVehicles(); // Araçları yükle
    } 
    else if (data.action === "showStep2") {
        step1Data = data.data || {};
        document.getElementById("step1").style.display = "none";
        document.getElementById("step2").style.display = "block";
        document.getElementById("summary").style.display = "none";
        document.getElementById("vehicleMortgage").style.display = "none";
        fetchBankBalance(); // Banka bakiyesini yükle
    } 
    else if (data.action === "showSummary") {
        step2Data = data.data.step2 || {};
        step1Data = data.data.step1 || {};
        document.getElementById("step1").style.display = "none";
        document.getElementById("step2").style.display = "none";
        document.getElementById("summary").style.display = "block";
        document.getElementById("vehicleMortgage").style.display = "none";
        
        document.getElementById("summaryText").innerHTML = `
            <strong>Meslek:</strong> ${step1Data.job || "Bilgi yok"}<br>
            <strong>Meslek Rütbesi:</strong> ${step1Data.jobRank || "Yok"}<br>
            <strong>Araç:</strong> ${step1Data.hasVehicle || "Hayır"}<br>
            <strong>Ev:</strong> ${step1Data.hasHouse || "Hayır"}<br>
            <strong>Aylık Gelir:</strong> ${step1Data.income || "Bilgi yok"}<br>
            <strong>Amaç:</strong> ${step1Data.purpose || "Bilgi yok"}<br>
            <strong>İş Yeri:</strong> ${step1Data.hasBusiness || "Hayır"}<br>
            <strong>Kefil İsim-Soyisim:</strong> ${step1Data.guarantorName || "Belirtilmemiş"}<br>
            <strong>Kefil Telefon Numarası:</strong> ${step1Data.guarantorPhone || "Belirtilmemiş"}<br>
            <strong>Kredi Türü:</strong> ${step1Data.creditType || "Belirtilmemiş"}<br>
            <strong>Miktar:</strong> ${data.data.amount || "0"}<br>
            <strong>Vade:</strong> ${step2Data.term || "0"} gün<br>
            <strong>Faiz:</strong> ${data.data.interest || "0"}<br>
            <strong>Toplam Geri Ödeme:</strong> ${data.data.totalRepayment || "0"}<br>
            ${data.data.vehicles ? `<strong>İpotek Edilen Araçlar:</strong> ${data.data.vehicles.join(', ')}` : ''}
        `;
    } 
    else if (data.action === "showVehicleMortgage") {
        step1Data = data.data.step1 || {};
        step2Data = data.data.step2 || {};
        document.getElementById("step1").style.display = "none";
        document.getElementById("step2").style.display = "none";
        document.getElementById("summary").style.display = "none";
        document.getElementById("vehicleMortgage").style.display = "block";
        populateVehicles(); // Araçları listeye ekle
    } 
    else if (data.action === "hide") {
        document.getElementById("container").style.display = "none";
        step1Data = {};
        step2Data = {};
        vehicles = [];
    }
});

function nextStep() {
    const data = {
        job: document.getElementById("job").value || "Bilgi yok",
        jobRank: document.getElementById("jobRank").value || "Yok",
        hasVehicle: document.getElementById("hasVehicle").value || "Hayır",
        hasHouse: document.getElementById("hasHouse").value || "Hayır",
        income: document.getElementById("income").value || "Bilgi yok",
        purpose: document.getElementById("purpose").value || "Bilgi yok",
        hasBusiness: document.getElementById("hasBusiness").value || "Hayır",
        guarantorName: document.getElementById("guarantorName").value || "Belirtilmemiş",
        guarantorPhone: document.getElementById("guarantorPhone").value || "Belirtilmemiş",
        creditType: document.getElementById("creditType").value || "Belirtilmemiş"
    };

    fetch(`https://${GetParentResourceName()}/submitStep1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(response => response.json()).then(data => console.log(data)).catch(err => console.error(err));
}

function submitStep2() {
    const amount = document.getElementById("amount").value;
    const term = document.getElementById("term").value;
    const maxAmount = Math.floor(bankBalance * 0.5); // Maksimum %50

    if (!amount || !term || term < 1 || term > 30 || parseInt(amount) > maxAmount) {
        alert(`Lütfen geçerli bir miktar ve vade (1-30 gün) girin! Maksimum miktar: ${maxAmount}`);
        return;
    }

    const data = {
        step1: step1Data,
        amount: amount,
        term: term
    };

    fetch(`https://${GetParentResourceName()}/submitStep2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(response => response.json()).then(data => console.log(data)).catch(err => console.error(err));
}

function showVehicleMortgage() {
    const data = {
        step1: step1Data,
        step2: step2Data
    };
    fetch(`https://${GetParentResourceName()}/showVehicleMortgage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(response => response.json()).then(data => console.log(data)).catch(err => console.error(err));
}

function submitVehicleMortgage() {
    const select = document.getElementById("vehicles");
    const selectedVehicles = Array.from(select.selectedOptions).map(option => option.value);

    if (selectedVehicles.length === 0) {
        alert("Lütfen en az bir araç seçin!");
        return;
    }

    const data = {
        step1: step1Data,
        step2: step2Data,
        vehicles: selectedVehicles
    };

    fetch(`https://${GetParentResourceName()}/submitVehicleMortgage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(response => response.json()).then(data => console.log(data)).catch(err => console.error(err));
}

function approve() {
    const data = {
        job: step1Data.job || "Bilgi yok",
        jobRank: step1Data.jobRank || "Yok",
        hasVehicle: step1Data.hasVehicle || "Hayır",
        hasHouse: step1Data.hasHouse || "Hayır",
        income: step1Data.income || "Bilgi yok",
        purpose: step1Data.purpose || "Bilgi yok",
        hasBusiness: step1Data.hasBusiness || "Hayır",
        guarantorName: step1Data.guarantorName || "Belirtilmemiş",
        guarantorPhone: step1Data.guarantorPhone || "Belirtilmemiş",
        creditType: step1Data.creditType || "Belirtilmemiş",
        amount: step2Data.amount || "0",
        term: step2Data.term || "0",
        interest: document.getElementById("summaryText").innerText.match(/Faiz: (\d+)/)?.[1] || "0",
        totalRepayment: document.getElementById("summaryText").innerText.match(/Toplam Geri Ödeme: (\d+)/)?.[1] || "0",
        vehicles: step2Data.vehicles || []
    };

    fetch(`https://${GetParentResourceName()}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(response => response.json()).then(data => console.log(data)).catch(err => console.error(err));

    alert("Krediniz onay aşamasında. UTC 24 saat içerisinde tarafınıza telefon ve mail aracılığı ile olumlu veya olumsuz dönüş yapılacaktır. Araç ipotek ettirdiyseniz, yeni teklif 24 saat içerisinde tarafınıza sunulacaktır.");
}

function cancel() {
    const data = {
        job: step1Data.job || "Bilgi yok",
        jobRank: step1Data.jobRank || "Yok",
        hasVehicle: step1Data.hasVehicle || "Hayır",
        hasHouse: step1Data.hasHouse || "Hayır",
        income: step1Data.income || "Bilgi yok",
        purpose: step1Data.purpose || "Bilgi yok",
        hasBusiness: step1Data.hasBusiness || "Hayır",
        guarantorName: step1Data.guarantorName || "Belirtilmemiş",
        guarantorPhone: step1Data.guarantorPhone || "Belirtilmemiş",
        creditType: step1Data.creditType || "Belirtilmemiş",
        amount: step2Data.amount || "0",
        term: step2Data.term || "0",
        interest: document.getElementById("summaryText").innerText.match(/Faiz: (\d+)/)?.[1] || "0",
        totalRepayment: document.getElementById("summaryText").innerText.match(/Toplam Geri Ödeme: (\d+)/)?.[1] || "0",
        vehicles: step2Data.vehicles || []
    };

    fetch(`https://${GetParentResourceName()}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(response => response.json()).then(data => console.log(data)).catch(err => console.error(err));
}

function closeUI() {
    fetch(`https://${GetParentResourceName()}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).then(response => response.json()).then(data => console.log(data)).catch(err => console.error(err));
}

function fetchBankBalance() {
    fetch(`https://${GetParentResourceName()}/getBankBalance`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    }).then(response => response.json()).then(data => {
        bankBalance = data.balance || 0;
        document.getElementById("bankBalance").value = bankBalance.toLocaleString() + " $";
    }).catch(err => console.error(err));
}

function fetchVehicles() {
    fetch(`https://${GetParentResourceName()}/getVehicles`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    }).then(response => response.json()).then(data => {
        vehicles = data.vehicles || [];
    }).catch(err => console.error(err));
}

function populateVehicles() {
    const select = document.getElementById("vehicles");
    select.innerHTML = '';
    vehicles.forEach(vehicle => {
        const option = document.createElement("option");
        option.value = vehicle.plate; // Plaka veya araç ismi
        option.text = `${vehicle.model} (Plaka: ${vehicle.plate})`;
        select.appendChild(option);
    });
}