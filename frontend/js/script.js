const pdfForm = document.getElementById('pdfForm');
const loadingIndicator = document.getElementById('loading');
const invoice_date = document.getElementById('invoice_date');
// const serial_number_list = document.getElementById('serial_number_list');

const today = new Date();
const day = String(today.getDate()).padStart(2, '0');
const month = String(today.getMonth() + 1).padStart(2, '0');
const year = today.getFullYear();
const formattedDate = `${year}-${month}-${day}`;
invoice_date.value = formattedDate;

// selectedTemplate.addEventListener("change", function () {
//     if (selectedTemplate.value === "Serial_No_&_List_of_Polycrystalline_Silicon_Photovoltaic_Modules") {
//         serial_number_list.classList.remove("hidden");
//     } else {
//         serial_number_list.classList.add("hidden");
//     }
// })

pdfForm.addEventListener('submit', function (event) {
    event.preventDefault();

    document.body.classList.add('loading');
    document.getElementById('loading-overlay').classList.remove('hidden');
    document.getElementById('loading-overlay').classList.add('loading-overlay');
    document.getElementById('spinner').classList.add('loading-spinner');


    const pdfFormData = Object.fromEntries(new FormData(pdfForm));
    let serialsArray = pdfFormData.serial_numbers.split(',').map(s => s.trim());
    pdfFormData.serial_numbers = serialsArray;
    if (serialsArray.length != Number(pdfFormData.no_of_panels)) {
        document.body.classList.remove('loading');
        document.getElementById('loading-overlay').classList.add('hidden');
        document.getElementById('loading-overlay').classList.remove('loading-overlay');
        document.getElementById('spinner').classList.remove('loading-spinner');
        if (serialsArray.length > Number(pdfFormData.no_of_panels)) {
            alert("Error: Number of serial numbers is more the number of panels");
        }
        else {
            alert("Error: Number of serial numbers is less than the number of panels");
        }
        return;
    }
    fetch(`${CONFIG.BACKEND_URL}/generate-file`, {
        method: 'POST',
        body: JSON.stringify(pdfFormData),
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => {
            return response.ok ? response.json() : response.text().then(text => { throw new Error(text); });
        })
        .then(data => {
            if (!data.previewLink) {
                // console.error("❌ No download link received from backend");
                return;
            }

            const docxUrl = data.previewLink;
            const newTab = window.open(docxUrl, "_blank");

            if (newTab) {
                newTab.focus();
            } else {
                alert("Please allow pop-ups to preview the PDF.");
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("Error generating PDF.Try again.");
        })
        .finally(() => {
            document.body.classList.remove('loading');
            document.getElementById('loading-overlay').classList.add('hidden');
            document.getElementById('loading-overlay').classList.remove('loading-overlay');
            document.getElementById('spinner').classList.remove('loading-spinner');
            console.log(`${CONFIG.BACKEND_URL}/generate-file`);
        });
});