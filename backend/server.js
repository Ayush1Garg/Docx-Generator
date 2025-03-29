const express = require('express');
// const cors = require('cors');
const fs = require('fs');
const path = require('path');
const docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
// const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;
// const BACKEND_URL = process.env.BACKEND_URL || "";

app.use(express.static('../frontend'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

app.post('/generate-file', (req, res) => {
    const {
        inverter_capacity, inverter_brand, panel_capacity, panel_brand,
        invoice_date, invoice_number, consumer_name, consumer_address,
        net_solar_capacity, no_of_panels, serial_numbers
    } = req.body;
    const template = "Certificates";
    const wordTemplate = template + ".docx";

    const templatesDir = path.join(__dirname, 'templates');
    const templatePath = path.join(templatesDir, wordTemplate);

    if (!fs.existsSync(templatePath)) {
        return res.status(400).send("Template not found.");
    }

    fs.readFile(templatePath, 'binary', (err, data) => {
        if (err) return res.status(500).send("Error reading template file.");

        const zip = new PizZip(data);
        const doc = new docxtemplater(zip);

        // let serialsArray = serial_numbers.split(',').map(s => s.trim());

        let serialData = {};
        for (let i = 0; i < 24; i++) {
            serialData[`serial_number_${i + 1}`] = serial_numbers[i] || "";
        }

        doc.render({
            ...serialData,
            inverter_capacity: inverter_capacity,
            inverter_brand: inverter_brand,
            panel_capacity: panel_capacity,
            panel_brand: panel_brand,
            invoice_date: invoice_date,
            invoice_number: invoice_number,
            consumer_name: consumer_name,
            consumer_address: consumer_address,
            net_solar_capacity: net_solar_capacity,
            no_of_panels: no_of_panels
        });

        const docxPath = path.join(outputDir, wordTemplate);
        fs.writeFileSync(docxPath, doc.getZip().generate({ type: 'nodebuffer' }));
        res.setHeader("Content-Type", "application/json");
        res.json({ previewLink: `/preview?file=${encodeURIComponent(wordTemplate)}&type=docx` });
        /*
                const pdfFilename = template + ".pdf";
                const pdfPath = path.join(outputDir, pdfFilename);
        
                const libreOfficeCmd = `"C:\\Program Files\\LibreOffice\\program\\soffice.com" --headless --convert-to pdf "${docxPath}" --outdir "${outputDir}"`;
        
                exec(libreOfficeCmd, (error, stdout, stderr) => {
                    if (error) {
        
                        return res.status(500).send("PDF conversion failed.");
                    }
        
                    if (!fs.existsSync(pdfPath)) {
                        return res.status(500).send("PDF file was not created.");
                    }
        
                    res.setHeader("Content-Type", "application/json");
                    const urlPdf = encodeURIComponent(pdfFilename);
                    const urlDocx = encodeURIComponent(wordTemplate);
        
                    // res.json({ downloadLink: `/download?file=${urlPdf}` });
                    res.json({ pdfPreviewLink: `/preview?file=${urlPdf}&type=pdf`, pdfDownloadLink: `/download?file=${urlPdf}&type=pdf`, docxDownloadLink: `/preview?file=${urlDocx}&type=docx` });
        
                });
        */
    });
});

/*
app.get('/download', (req, res) => {
    const filename = req.query.file;
    const file = path.join(__dirname, 'output', filename);

    if (!fs.existsSync(file)) {
        return res.status(404).send("File not found.");
    }

    res.download(file, filename, (err) => {
        if (err) {
            console.error("Error downloading file:", err);
            res.status(500).send("Error downloading file.");
        }
    });
});
*/
app.get('/preview', (req, res) => {
    const filename = req.query.file;
    const fileType = req.query.type;
    const filePath = path.join(outputDir, decodeURIComponent(filename));

    if (!fs.existsSync(filePath)) {
        return res.status(404).send("File not found.");
    }

    if (fileType == "pdf") {
        res.setHeader("Content-Type", "application/pdf");
    } else if (fileType == "docx") {
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    } else {
        return res.status(400).send("Invalid file type.");
    }
    res.setHeader("Content-Disposition", "inline");
    fs.createReadStream(filePath).pipe(res);
});


// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});