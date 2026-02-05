const API_URL = "https://api.escuelajs.co/api/v1/products";

const productsContainer = document.getElementById("productsContainer");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");
const loadingContainer = document.getElementById("loadingContainer");
const noResults = document.getElementById("noResults");
const paginationContainer = document.getElementById("paginationContainer");
const itemsPerPageSelect = document.getElementById("itemsPerPage");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");
const pageNumbers = document.getElementById("pageNumbers");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const sortTitleBtn = document.getElementById("sortTitleBtn");
const sortPriceBtn = document.getElementById("sortPriceBtn");

let allProducts = [];
let filteredProducts = [];
let selectedCategory = "all";
let currentPage = 1;
let itemsPerPage = 10;
let sortField = ""; // 'title' or 'price'
let sortDirection = "asc"; // 'asc' or 'desc'

function exportCurrentViewToCSV() {
  if (!filteredProducts || filteredProducts.length === 0) return;

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);
  const productsToExport = filteredProducts.slice(startIndex, endIndex);

  const headers = ['id', 'title', 'price', 'category', 'description', 'image'];
  const rows = [headers.join(',')];

  const escapeCell = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return '"' + s + '"';
  };

  productsToExport.forEach(p => {
    const img = (p.images && p.images[0]) ? p.images[0].replace(/['\[\]"]/g, '') : '';
    const category = p.category?.name || '';
    const line = [p.id, p.title, p.price, category, p.description || '', img].map(escapeCell).join(',');
    rows.push(line);
  });

  const csvContent = rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  const filename = `products_page_${currentPage}_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}.csv`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function loadProducts() {
  loadingContainer.style.display = "block";
  productsContainer.innerHTML = "";
  noResults.style.display = "none";
  paginationContainer.style.display = "none";

  try {
    const res = await fetch(API_URL);
    allProducts = await res.json();
    filterProducts();
  } catch (error) {
    console.error("Lỗi khi load API:", error);
    noResults.style.display = "block";
    noResults.innerHTML = '<i class="fas fa-exclamation-circle"></i><p>Có lỗi khi tải dữ liệu</p>';
  } finally {
    loadingContainer.style.display = "none";
  }
}

function filterProducts() {
  currentPage = 1; // Reset về trang 1 khi filter
  filteredProducts = allProducts;

  // Lọc theo danh mục
  if (selectedCategory !== "all") {
    filteredProducts = filteredProducts.filter(product => 
      product.category?.name?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }

  // Tìm kiếm theo tên sản phẩm
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    filteredProducts = filteredProducts.filter(product =>
      product.title.toLowerCase().includes(searchTerm) ||
      product.category?.name?.toLowerCase().includes(searchTerm)
    );
  }

  // Áp dụng sắp xếp trước khi render (nếu có)
  sortFilteredProducts();

  renderPage();
}

function sortFilteredProducts() {
  if (!sortField) return;

  filteredProducts.sort((a, b) => {
    if (sortField === 'title') {
      const res = a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' });
      return sortDirection === 'asc' ? res : -res;
    }

    if (sortField === 'price') {
      const res = (a.price || 0) - (b.price || 0);
      return sortDirection === 'asc' ? res : -res;
    }

    return 0;
  });
}

function renderPage() {
  productsContainer.innerHTML = "";

  if (filteredProducts.length === 0) {
    noResults.style.display = "block";
    paginationContainer.style.display = "none";
    return;
  }

  noResults.style.display = "none";

  // Tính toán trang
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const productsToShow = filteredProducts.slice(startIndex, endIndex);

  // Render sản phẩm của trang hiện tại
  productsToShow.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.productId = product.id;

    const imageUrl = product.images && product.images[0] 
      ? product.images[0].replace(/["\[\]]/g, '') 
      : 'https://via.placeholder.com/220x220?text=No+Image';

    const categoryName = product.category?.name || "Khác";
    const description = product.description || "Không có mô tả sản phẩm";

    card.innerHTML = `
      <div class="product-image">
        <img src="${imageUrl}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/220x220?text=Image+Error'">
        <div class="product-description">${description}</div>
      </div>
      <div class="product-info">
        <span class="product-category">${categoryName}</span>
        <h3 class="product-title">${product.title}</h3>
        <div class="product-price">$${product.price}</div>
        <div class="product-id">ID: #${product.id}</div>
      </div>
    `;

    productsContainer.appendChild(card);
    // Open modal on click
    card.addEventListener('click', () => openProductModal(product.id));
  });

  // Cập nhật pagination controls
  updatePagination(totalPages);
}

// Modal logic
const productModalEl = document.getElementById('productModal');
let productModalInstance = null;
if (productModalEl && window.bootstrap) {
  productModalInstance = new bootstrap.Modal(productModalEl);
}

const modalImage = document.getElementById('modalImage');
const modalTitleView = document.getElementById('modalTitleView');
const modalPriceView = document.getElementById('modalPriceView');
const modalCategoryView = document.getElementById('modalCategoryView');
const modalDescriptionView = document.getElementById('modalDescriptionView');
const modalTitleInput = document.getElementById('modalTitleInput');
const modalPriceInput = document.getElementById('modalPriceInput');
const modalDescriptionInput = document.getElementById('modalDescriptionInput');
const editBtn = document.getElementById('editBtn');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

let currentModalProductId = null;

function openProductModal(id) {
  const product = allProducts.find(p => p.id == id) || filteredProducts.find(p => p.id == id);
  if (!product) return;
  currentModalProductId = product.id;

  modalImage.src = (product.images && product.images[0]) ? product.images[0].replace(/['\[\]"]/g, '') : 'https://via.placeholder.com/440x440?text=No+Image';
  modalTitleView.textContent = product.title;
  modalPriceView.textContent = `$${product.price}`;
  modalCategoryView.textContent = product.category?.name || '';
  modalDescriptionView.textContent = product.description || '';

  modalTitleInput.value = product.title;
  modalPriceInput.value = product.price;
  modalDescriptionInput.value = product.description || '';

  // Reset edit state
  setEditMode(false);

  if (!productModalInstance && productModalEl && window.bootstrap) productModalInstance = new bootstrap.Modal(productModalEl);
  productModalInstance && productModalInstance.show();
}

function setEditMode(editing) {
  if (editing) {
    modalTitleView.style.display = 'none';
    modalPriceView.style.display = 'none';
    modalDescriptionView.style.display = 'none';

    modalTitleInput.style.display = '';
    modalPriceInput.style.display = '';
    modalDescriptionInput.style.display = '';

    editBtn.style.display = 'none';
    saveBtn.style.display = '';
    cancelBtn.style.display = '';
  } else {
    modalTitleView.style.display = '';
    modalPriceView.style.display = '';
    modalDescriptionView.style.display = '';

    modalTitleInput.style.display = 'none';
    modalPriceInput.style.display = 'none';
    modalDescriptionInput.style.display = 'none';

    editBtn.style.display = '';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
  }
}

editBtn && editBtn.addEventListener('click', () => setEditMode(true));
cancelBtn && cancelBtn.addEventListener('click', () => {
  // restore values
  const product = allProducts.find(p => p.id == currentModalProductId) || filteredProducts.find(p => p.id == currentModalProductId);
  if (!product) return setEditMode(false);
  modalTitleInput.value = product.title;
  modalPriceInput.value = product.price;
  modalDescriptionInput.value = product.description || '';
  setEditMode(false);
});

saveBtn && saveBtn.addEventListener('click', async () => {
  if (!currentModalProductId) return;
  const updated = {
    title: modalTitleInput.value,
    price: parseFloat(modalPriceInput.value) || 0,
    description: modalDescriptionInput.value
  };

  try {
    saveBtn.disabled = true;
    const res = await fetch(`${API_URL}/${currentModalProductId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (!res.ok) throw new Error('Update failed');
    const data = await res.json();

    // Update local product data
    const idxAll = allProducts.findIndex(p => p.id == currentModalProductId);
    if (idxAll >= 0) allProducts[idxAll] = { ...allProducts[idxAll], ...data };
    const idxFiltered = filteredProducts.findIndex(p => p.id == currentModalProductId);
    if (idxFiltered >= 0) filteredProducts[idxFiltered] = { ...filteredProducts[idxFiltered], ...data };

    // Reflect changes in modal
    modalTitleView.textContent = data.title;
    modalPriceView.textContent = `$${data.price}`;
    modalDescriptionView.textContent = data.description || '';

    setEditMode(false);
    renderPage();
  } catch (err) {
    console.error('Update error', err);
    alert('Có lỗi khi cập nhật sản phẩm');
  } finally {
    saveBtn.disabled = false;
  }
});

function updatePagination(totalPages) {
  if (filteredProducts.length <= itemsPerPage) {
    paginationContainer.style.display = "none";
    return;
  }

  paginationContainer.style.display = "flex";

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredProducts.length);

  pageInfo.textContent = `Trang ${currentPage} / ${totalPages} (${startItem}-${endItem} của ${filteredProducts.length})`;

  // Render numbered page buttons
  pageNumbers.innerHTML = "";
  // Display a compact range if too many pages
  const maxButtons = 7;
  let startPage = 1;
  let endPage = totalPages;
  if (totalPages > maxButtons) {
    const before = Math.floor(maxButtons / 2);
    startPage = Math.max(1, currentPage - before);
    endPage = startPage + maxButtons - 1;
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = endPage - maxButtons + 1;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement('button');
    btn.className = 'page-number';
    if (i === currentPage) btn.classList.add('active');
    btn.textContent = i;
    btn.addEventListener('click', () => {
      if (currentPage === i) return;
      currentPage = i;
      renderPage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    pageNumbers.appendChild(btn);
  }

  // Disable/Enable nút
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
}

// Event listeners
searchInput.addEventListener("input", filterProducts);

itemsPerPageSelect.addEventListener("change", (e) => {
  itemsPerPage = parseInt(e.target.value);
  currentPage = 1;
  renderPage();
});

// Sort button handlers
if (sortTitleBtn) {
  sortTitleBtn.addEventListener('click', () => {
    if (sortField === 'title') {
      sortDirection = (sortDirection === 'asc') ? 'desc' : 'asc';
    } else {
      sortField = 'title';
      sortDirection = 'asc';
    }
    // update UI
    sortTitleBtn.classList.add('active');
    sortPriceBtn && sortPriceBtn.classList.remove('active');
    filterProducts();
  });
}

if (sortPriceBtn) {
  sortPriceBtn.addEventListener('click', () => {
    if (sortField === 'price') {
      sortDirection = (sortDirection === 'asc') ? 'desc' : 'asc';
    } else {
      sortField = 'price';
      sortDirection = 'asc';
    }
    // update UI
    sortPriceBtn.classList.add('active');
    sortTitleBtn && sortTitleBtn.classList.remove('active');
    filterProducts();
  });
}

if (exportCsvBtn) {
  exportCsvBtn.addEventListener('click', exportCurrentViewToCSV);
}

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedCategory = btn.getAttribute("data-category");
    filterProducts();
  });
});

prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderPage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

nextBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderPage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// Load products on page load
loadProducts();
