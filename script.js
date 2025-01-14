
// Load event
window.addEventListener('load', init);


document.getElementById('addRowButton').addEventListener('click', addNewRow);

document.getElementById('logoContainer').addEventListener('click', function () {
    setDisplayValue('popup', 'block');
});

document.getElementById('closePopup').addEventListener('click', function() {
    setDisplayValue('popup', 'none');
});

document.getElementById('printButton').addEventListener('click', prePrintInvoice);

document.addEventListener('keydown', function(event) {
    // Controleer of de gewenste toetscombinatie is ingedrukt (bijv. Ctrl + p)
    if (event.ctrlKey && event.key === 'p') {
        event.preventDefault(); // Voorkom de standaardactie van Ctrl + P (afdrukken)
        prePrintInvoice(); // Voer de gewenste actie uit (bijv. klik op een knop)
    }
});


// window.addEventListener('click', function(event) {
//     if (event.target == document.getElementById('popup')) {
//         setDisplayValue('popup', 'none');
//     }
// });

document.getElementById('logoInput').addEventListener('change', setLogo);

function init () {
    document.getElementById('inputFactuurnummer').value = setTodaysDate();
}

function prePrintInvoice() {
    // actions to make page printable
    setDateToTextType('inputFactuurdatum');
    setDateToTextType('inputVervaldatum'); 
    disableVatDropdown('invoiceVatTd'); // Schakel de dropdown uit

    // Run print dialog
    window.print();

    // Undo actions after printing or cancelling
    setTimeout(function() { 
            setTextToDateType('inputFactuurdatum');
            setTextToDateType('inputVervaldatum');
            enableVatDropdown('invoiceVatTd');
    }, 1000);
}

function setTodaysDate() {
    // Haal de datum van vandaag op
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Januari is 0!
    const year = today.getFullYear();

    // Maak een datumstring in het formaat yyyy-mm-dd
    const todayString = year + '' + month + '' + day;

    return todayString;
}

// Before we can print we have to get rid of the calendar icon by setting the input type to text
function setDateToTextType(fieldId) {
    const inputField = document.getElementById(fieldId);
    const dateValue = inputField.value;
    if (dateValue) {
        const date = new Date(dateValue); 
        const dateString = date.toLocaleDateString();
        inputField.type = 'text';
        inputField.value = dateString;
    }
}

// When the print dialog is closed we must set the input type back to date. Otherwise the user cannot edit the date anymore.
function setTextToDateType(fieldId) {
    const inputField = document.getElementById(fieldId);
    const dateString = inputField.value; // Datumstring in formaat DD-MM-YYYY 
    if (dateString) {
        const parts = dateString.split("-"); // Split de string in delen 
        const date = new Date(parts[2], parts[1] - 1, parts[0]); 
        const formattedDate = date.toISOString().split('T')[0]; // Zet de datum om naar een string in het formaat YYYY-MM-DD
        inputField.type = 'date';
        inputField.value = formattedDate;
    }
}

// function setNumberToTextType (className) {
//     const inputFields = document.querySelectorAll('.' + className);
//     console.log(inputFields);
//     inputFields.forEach(function(inputField) {
//         const numberValue = inputField.value;
//         inputField.type = 'text';
//         inputField.value = numberValue;
//     })
// }

// function setTextToNumberType (className) {
//     const inputFields = document.querySelectorAll('.' + className);
//     console.log(inputFields);
//     inputFields.forEach(function(inputField) {
//         const numberValue = inputField.value;
//         inputField.type = 'number';
//         inputField.value = numberValue;
//     })
// }

function disableVatDropdown(classNameParent) {
    const parentNodes = document.querySelectorAll('.' + classNameParent);

    parentNodes.forEach(function(parentNode) {
        const childValue = parentNode.children[0].options[parentNode.children[0].selectedIndex].text;
        parentNode.children[0].style.display = 'none';
        parentNode.children[1].style.display = 'inline-block';
        parentNode.children[1].textContent = childValue;
    })
}

function enableVatDropdown(classNameParent) {
    const parentNodes = document.querySelectorAll('.' + classNameParent);

    parentNodes.forEach(function(parentNode) {
        const childValue = parentNode.children[0].value; // First child that is visible is the div element
        parentNode.children[0].style.display = 'inline-block'; // Set select element visible
        parentNode.children[1].style.display = 'none'; // Set div unvisible
        parentNode.children[0].value = childValue.replace('%', ''); // Set the selected value back in the select element
    })
}

function addNewRow() {
    const tableBody = document.getElementById('invoiceTableBody');
    const newRow = document.createElement('tr');

    newRow.innerHTML = `
        <td><input type="text" class="invoiceDescriptionInput printNoBorder" name="" id="" maxlength="75"></td>
        <td><input type="text" class="invoiceQuantityInput printNoBorder" name="" id="" maxlength="10"></td>
        <td><input type="text" class="invoiceUnitPriceInput printNoBorder" name="" id="" maxlength="10"></td>
        <td class="invoiceVatTd">
            <select class="invoiceVatInput printNoBorder" name="" id="">
                <option value="21">21%</option>
                <option value="9">9%</option>
                <option value="0">0%</option>
            </select>
            <div class="staticVatValue"></div>
        </td>
        <td class="invoiceTotalTd"></td>
        <td class="actionButton">
            <button type="button" class="btn btn-primary deleteRowButton">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `;

    tableBody.appendChild(newRow);
    
    updateTotal(newRow);
    addDeleteFunctionality(newRow);
}

function updateTotal(row) {
    const quantityInput = row.querySelector('td:nth-child(2) input');
    const priceInput = row.querySelector('td:nth-child(3) input');
    const vatSelect = row.querySelector('td:nth-child(4) select');
    const totalCell = row.querySelector('td:nth-child(5)');

    function calculateTotal() {
        const quantity = parseFloat(quantityInput.value.replace(',', '.')) || 0;
        const price = parseFloat(priceInput.value.replace(',', '.')) || 0;
        const vat = parseFloat(vatSelect.value) || 0;
        const total = quantity * price;
        totalCell.textContent = total.toFixed(2).replace('.', ',');

        calculateSubtotals();
    }

    quantityInput.addEventListener('input', function () {

        calculateTotal();

        // Vervang punten door komma's terwijl er wordt getypt
        this.value = this.value.replace('.', ',');
                
        // Zorg ervoor dat alleen numerieke waarden en komma's zijn toegestaan
        const validValue = this.value.replace(/[^0-9,]/g, '');
        if (this.value !== validValue) {
            this.value = validValue;
        }
    });
    priceInput.addEventListener('input', function () {
        
        calculateTotal();

        // Vervang punten door komma's terwijl er wordt getypt
        this.value = this.value.replace('.', ',');
                
        // Zorg ervoor dat alleen numerieke waarden en komma's zijn toegestaan
        const validValue = this.value.replace(/[^0-9,]/g, '');
        if (this.value !== validValue) {
            this.value = validValue;
        }
    });

    vatSelect.addEventListener('change', calculateTotal);
}

function addDeleteFunctionality(row) { 
    const deleteButton = row.querySelector('.deleteRowButton'); 
    deleteButton.addEventListener('click', () => { 
        row.remove(); 
        calculateSubtotals(); 
    }); 
}

function calculateSubtotals() {
    const rows = document.querySelectorAll('#invoiceTableBody tr');
    let subTotal = 0;
    let vat21Total = 0;
    let vat9Total = 0;
    let vat0Total = 0;
    let hasVat0 = false; // Variabele om aanwezigheid van 0% BTW bij te houden

    rows.forEach(row => {
        const quantity = parseFloat(row.querySelector('td:nth-child(2) input').value.replace(',', '.')) || 0;
        const price = parseFloat(row.querySelector('td:nth-child(3) input').value.replace(',', '.')) || 0;
        const vat = parseFloat(row.querySelector('td:nth-child(4) select').value) || 0;
        const total = quantity * price;
        
        subTotal += total;

        switch (vat) {
            case 21:
                vat21Total += total * 0.21;
                break;
            case 9:
                vat9Total += total * 0.09;
                break;
            case 0:
                vat0Total += total * 0.00; 
                if (total > 0) { 
                    hasVat0 = true; // Instellen als er een totaalbedrag groter dan 0 is 
                } 
                break;
        }
    });

    const totalInclVat = subTotal + vat21Total + vat9Total;

    document.getElementById('subTotalSpan').textContent = subTotal.toFixed(2).replace('.', ',');
    document.getElementById('vat21TotalSpan').textContent = vat21Total.toFixed(2).replace('.', ',');
    document.getElementById('vat9TotalSpan').textContent = vat9Total.toFixed(2).replace('.', ',');
    document.getElementById('vat0TotalSpan').textContent = vat0Total.toFixed(2).replace('.', ',');
    document.getElementById('totalInclVatSpan').textContent = totalInclVat.toFixed(2).replace('.', ',');

    document.getElementById('vat21Row').style.display = vat21Total > 0 ? 'block' : 'none';
    document.getElementById('vat9Row').style.display = vat9Total > 0 ? 'block' : 'none';
    document.getElementById('vat0Row').style.display = hasVat0 ? 'block' : 'none'; // Verbergen of tonen op basis van hasVat0
    document.querySelector('#vatRow').style.display = vat21Total > 0 || vat9Total > 0 || hasVat0 ? 'none' : 'block';

}

// Set the value of the CSS property display 
function setDisplayValue(elementId, displayValue) {
    document.getElementById(elementId).style.display = displayValue;
}

// Displays the logo when the user uploads an image
function setLogo(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const logoContainer = document.getElementById('logoContainer');
            logoContainer.innerHTML = `<img src="${e.target.result}" alt="Logo">`;
            setDisplayValue('popup', 'none');
        };
        reader.readAsDataURL(file);
    }
}