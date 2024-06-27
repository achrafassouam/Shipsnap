function toggleShow () {
	var el = document.getElementById("box");
	el.classList.toggle("show");
  }

document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.querySelector('.search_button');
    const searchInput = document.querySelector('.search_input');
    const itemList = document.getElementById('item-list');

    searchButton.addEventListener('click', function() {
        const itemText = searchInput.value.trim();
        if (itemText !== '') {
            addItem(itemText);
            searchInput.value = ''; // Clear the input field
        }
    });

    function addItem(itemText) {
        // Remove the previous item, if it exists
        const previousItem = itemList.firstChild;
        if (previousItem) {
            itemList.removeChild(previousItem);
        }

        // Create and append the new item
        const newItem = document.createElement('div');
        newItem.classList.add('item');

        const containerNumber = document.createElement('div');
        containerNumber.classList.add('container-number');
        containerNumber.textContent = `Container Number: ${itemText}`;

        const shippingCompany = document.createElement('div');
        shippingCompany.classList.add('shipping-company');
        shippingCompany.textContent = 'Shipping Company: ';

        const eta = document.createElement('div');
        eta.classList.add('eta');
        eta.textContent = 'ETA: ';

        newItem.appendChild(containerNumber);
        newItem.appendChild(shippingCompany);
        newItem.appendChild(eta);
        itemList.appendChild(newItem);
    }

    function removeItem(itemElement) {
        itemList.removeChild(itemElement);
    }
});
