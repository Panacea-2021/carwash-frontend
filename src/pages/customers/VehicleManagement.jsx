import React, { useState, useEffect } from "react";
import {
  Car,
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  Image as ImageIcon,
  Upload,
  X,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import { vehicleCatalogService } from "../../api/vehicleCatalogService";
import ModalManager from "../../components/modals/ModalManager";
import DeleteModal from "../../components/modals/DeleteModal";
import usePagePermissions from "../../utils/usePagePermissions";

const API_BASE = "https://api.babacarwash.com";

const VehicleManagement = () => {
  const pp = usePagePermissions("vehicles");
  // ============== STATE ==============
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [totalModels, setTotalModels] = useState(0);

  // Brand modal
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editBrand, setEditBrand] = useState(null);

  // Model modal
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [editModel, setEditModel] = useState(null);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ============== FETCH ==============
  const fetchBrands = async (search = "") => {
    setBrandsLoading(true);
    try {
      const res = await vehicleCatalogService.listBrands(search);
      setBrands(res.data || []);
      // Calculate total models
      const total = (res.data || []).reduce(
        (sum, b) => sum + (b.modelCount || 0),
        0,
      );
      setTotalModels(total);
    } catch (err) {
      toast.error("Failed to load brands");
    } finally {
      setBrandsLoading(false);
    }
  };

  const fetchModels = async (brandId, search = "") => {
    setModelsLoading(true);
    try {
      const res = await vehicleCatalogService.listModels(
        brandId,
        search,
        typeFilter,
      );
      setModels(res.data || []);
    } catch (err) {
      toast.error("Failed to load models");
    } finally {
      setModelsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      fetchModels(selectedBrand._id, modelSearch);
    }
  }, [selectedBrand, typeFilter]);

  // ============== HANDLERS ==============
  const handleBrandSearch = (e) => {
    const value = e.target.value;
    setBrandSearch(value);
    fetchBrands(value);
  };

  const handleModelSearch = (e) => {
    const value = e.target.value;
    setModelSearch(value);
    if (selectedBrand) fetchModels(selectedBrand._id, value);
  };

  const handleBrandClick = (brand) => {
    setSelectedBrand(brand);
    setModelSearch("");
    fetchModels(brand._id);
  };

  const openAddBrand = () => {
    setEditBrand(null);
    setIsBrandModalOpen(true);
  };

  const openEditBrand = (brand, e) => {
    e.stopPropagation();
    setEditBrand(brand);
    setIsBrandModalOpen(true);
  };

  const openDeleteBrand = (brand, e) => {
    e.stopPropagation();
    setDeleteTarget(brand);
    setDeleteType("brand");
    setIsDeleteModalOpen(true);
  };

  const openAddModel = () => {
    if (!selectedBrand) {
      toast.error("Please select a brand first");
      return;
    }
    setEditModel(null);
    setIsModelModalOpen(true);
  };

  const openEditModel = (model) => {
    setEditModel(model);
    setIsModelModalOpen(true);
  };

  const openDeleteModel = (model) => {
    setDeleteTarget(model);
    setDeleteType("model");
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (deleteType === "brand") {
        await vehicleCatalogService.deleteBrand(deleteTarget._id);
        toast.success("Brand deleted successfully");
        if (selectedBrand?._id === deleteTarget._id) {
          setSelectedBrand(null);
          setModels([]);
        }
        fetchBrands(brandSearch);
      } else {
        await vehicleCatalogService.deleteModel(deleteTarget._id);
        toast.success("Model deleted successfully");
        if (selectedBrand) fetchModels(selectedBrand._id, modelSearch);
        fetchBrands(brandSearch);
      }
      setIsDeleteModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBrandSuccess = () => {
    fetchBrands(brandSearch);
    setIsBrandModalOpen(false);
  };

  const handleModelSuccess = () => {
    if (selectedBrand) fetchModels(selectedBrand._id, modelSearch);
    fetchBrands(brandSearch);
    setIsModelModalOpen(false);
  };

  // ============== CATEGORY BADGES ==============
  const getCategoryColor = (category) => {
    const colors = {
      hatchback: "bg-blue-100 text-blue-700",
      sedan: "bg-green-100 text-green-700",
      suv: "bg-orange-100 text-orange-700",
      muv: "bg-purple-100 text-purple-700",
      bike: "bg-red-100 text-red-700",
      scooter: "bg-pink-100 text-pink-700",
      other: "bg-gray-100 text-gray-700",
    };
    return colors[category] || colors.other;
  };

  // ============== RENDER ==============
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Car className="w-7 h-7 text-indigo-600" />
            Vehicle Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage vehicle brands and models for the customer app
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search brands */}
          {pp.isToolbarVisible("search") && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              placeholder="Search Brand..."
              value={brandSearch}
              onChange={handleBrandSearch}
              className="pl-9 pr-4 py-2.5 bg-white border rounded-lg text-sm w-[200px] outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          )}
          {/* Type filter */}
          {pp.isToolbarVisible("typeFilter") && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">All Types</option>
            <option value="4wheeler">4 Wheeler</option>
            <option value="2wheeler">2 Wheeler</option>
          </select>
          )}
          <span className="text-sm font-medium text-slate-600 bg-white px-3 py-2.5 rounded-lg border">
            Total Models: {totalModels}
          </span>
        </div>
      </div>

      {/* Main Layout: Brands sidebar + Models grid */}
      <div className="flex gap-6 h-[calc(100vh-180px)]">
        {/* LEFT: Brands List */}
        <div className="w-[300px] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Brands</h2>
            {pp.isToolbarVisible("addBrand") && (
            <button
              onClick={openAddBrand}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Brand
            </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {brandsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            ) : brands.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <Car className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No brands found</p>
              </div>
            ) : (
              brands.map((brand) => (
                <div
                  key={brand._id}
                  onClick={() => handleBrandClick(brand)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-100 transition-all duration-200 group
                    ${
                      selectedBrand?._id === brand._id
                        ? "bg-indigo-600 text-white"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                >
                  {/* Brand Logo */}
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {brand.logo ? (
                      <img
                        src={`${API_BASE}${brand.logo}`}
                        alt={brand.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full items-center justify-center text-xs font-bold ${brand.logo ? "hidden" : "flex"} ${
                        selectedBrand?._id === brand._id
                          ? "text-indigo-200"
                          : "text-slate-400"
                      }`}
                    >
                      {brand.name?.charAt(0)}
                    </div>
                  </div>

                  {/* Brand Name + Count */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium text-sm truncate ${
                        selectedBrand?._id === brand._id ? "text-white" : ""
                      }`}
                    >
                      {brand.name}
                    </p>
                    <p
                      className={`text-xs ${
                        selectedBrand?._id === brand._id
                          ? "text-indigo-200"
                          : "text-slate-400"
                      }`}
                    >
                      ({brand.modelCount || 0})
                    </p>
                  </div>

                  {/* Actions */}
                  {(pp.isActionVisible("edit") || pp.isActionVisible("delete")) && (
                  <div
                    className={`flex gap-1 ${
                      selectedBrand?._id === brand._id
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    } transition-opacity`}
                  >
                    {pp.isActionVisible("edit") && (
                    <button
                      onClick={(e) => openEditBrand(brand, e)}
                      className={`p-1 rounded ${
                        selectedBrand?._id === brand._id
                          ? "hover:bg-indigo-500 text-white"
                          : "hover:bg-slate-200 text-slate-400"
                      }`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    )}
                    {pp.isActionVisible("delete") && (
                    <button
                      onClick={(e) => openDeleteBrand(brand, e)}
                      className={`p-1 rounded ${
                        selectedBrand?._id === brand._id
                          ? "hover:bg-red-500 text-white"
                          : "hover:bg-red-100 text-red-400"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    )}
                  </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Models Grid */}
        <div className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-bold text-slate-800">
              {selectedBrand
                ? `${selectedBrand.name} Models`
                : "Select a Brand"}
            </h2>
            <div className="flex items-center gap-2">
              {selectedBrand && (
                <>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      placeholder="Search models..."
                      value={modelSearch}
                      onChange={handleModelSearch}
                      className="pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-sm w-[200px] outline-none focus:border-indigo-500"
                    />
                  </div>
                  {pp.isToolbarVisible("addModel") && (
                  <button
                    onClick={openAddModel}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
                  >
                    <Plus className="w-4 h-4" /> Add Model
                  </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!selectedBrand ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Car className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">
                  Select a brand to view models
                </p>
                <p className="text-sm mt-1">
                  Choose a brand from the left panel
                </p>
              </div>
            ) : modelsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : models.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Car className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">No models found</p>
                <p className="text-sm mt-1">
                  Add a model for {selectedBrand.name}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      {pp.isColumnVisible("image") && (
                      <th className="px-4 py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                        Image
                      </th>
                      )}
                      {pp.isColumnVisible("modelName") && (
                      <th className="px-4 py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                        Model Name
                      </th>
                      )}
                      {pp.isColumnVisible("type") && (
                      <th className="px-4 py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                        Type
                      </th>
                      )}
                      {pp.isColumnVisible("category") && (
                      <th className="px-4 py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                        Category
                      </th>
                      )}
                      {pp.isColumnVisible("status") && (
                      <th className="px-4 py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                        Status
                      </th>
                      )}
                      {(pp.isActionVisible("edit") || pp.isActionVisible("delete")) && (
                      <th className="px-4 py-3 text-xs font-bold uppercase text-slate-600 tracking-wider text-right">
                        Actions
                      </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {models.map((model) => (
                      <tr
                        key={model._id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        {pp.isColumnVisible("image") && (
                        <td className="px-4 py-3">
                          <div className="w-16 h-12 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                            {model.image ? (
                              <img
                                src={`${API_BASE}${model.image}`}
                                alt={model.name}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <Car className="w-6 h-6 text-slate-300" />
                            )}
                          </div>
                        </td>
                        )}
                        {pp.isColumnVisible("modelName") && (
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {model.name}
                        </td>
                        )}
                        {pp.isColumnVisible("type") && (
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              model.vehicleType === "4wheeler"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {model.vehicleType === "4wheeler"
                              ? "4 Wheeler"
                              : "2 Wheeler"}
                          </span>
                        </td>
                        )}
                        {pp.isColumnVisible("category") && (
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getCategoryColor(model.category)}`}
                          >
                            {model.category}
                          </span>
                        </td>
                        )}
                        {pp.isColumnVisible("status") && (
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              model.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {model.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        )}
                        {(pp.isActionVisible("edit") || pp.isActionVisible("delete")) && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {pp.isActionVisible("edit") && (
                            <button
                              onClick={() => openEditModel(model)}
                              className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            )}
                            {pp.isActionVisible("delete") && (
                            <button
                              onClick={() => openDeleteModel(model)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            )}
                          </div>
                        </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============== BRAND MODAL ============== */}
      <BrandModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onSuccess={handleBrandSuccess}
        editData={editBrand}
      />

      {/* ============== MODEL MODAL ============== */}
      <ModelModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        onSuccess={handleModelSuccess}
        editData={editModel}
        brandId={selectedBrand?._id}
        brandName={selectedBrand?.name}
      />

      {/* ============== DELETE MODAL ============== */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title={`Delete ${deleteType === "brand" ? "Brand" : "Model"}`}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? ${
          deleteType === "brand"
            ? "All models under this brand will also be deleted."
            : ""
        }`}
      />
    </div>
  );
};

// ============== BRAND MODAL COMPONENT ==============
const BrandModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setName(editData.name || "");
        setStatus(editData.status || "active");
        setLogoPreview(editData.logo ? `${API_BASE}${editData.logo}` : null);
      } else {
        setName("");
        setStatus("active");
        setLogoPreview(null);
      }
      setLogoFile(null);
    }
  }, [editData, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Brand name is required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("status", status);
      if (logoFile) formData.append("file", logoFile);

      if (editData) {
        await vehicleCatalogService.updateBrand(editData._id, formData);
        toast.success("Brand updated successfully");
      } else {
        await vehicleCatalogService.createBrand(formData);
        toast.success("Brand added successfully");
      }
      onSuccess();
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Operation failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalManager
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "Edit Brand" : "Add Brand"}
      pageName="VEHICLE_CATALOG"
      modalType={editData ? "EDIT" : "CREATE"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Brand Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Brand Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            placeholder="Enter brand name"
            autoFocus
          />
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Logo Upload
          </label>
          <div
            className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => document.getElementById("brand-logo-input").click()}
          >
            {logoPreview ? (
              <div className="relative inline-block">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-20 h-20 object-contain mx-auto"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLogoFile(null);
                    setLogoPreview(null);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <p className="text-sm text-indigo-600 font-medium">
                  + Upload Logo
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Max file size: 2MB
                </p>
              </>
            )}
            <input
              id="brand-logo-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setStatus(status === "active" ? "inactive" : "active")
              }
              className={`relative w-11 h-6 rounded-full transition-colors ${
                status === "active" ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  status === "active" ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-slate-600 capitalize">{status}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-70"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </div>
      </form>
    </ModalManager>
  );
};

// ============== MODEL MODAL COMPONENT ==============
const ModelModal = ({
  isOpen,
  onClose,
  onSuccess,
  editData,
  brandId,
  brandName,
}) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [vehicleType, setVehicleType] = useState("4wheeler");
  const [category, setCategory] = useState("hatchback");
  const [status, setStatus] = useState("active");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const categories4w = ["hatchback", "sedan", "suv", "muv", "other"];
  const categories2w = ["bike", "scooter", "other"];

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setName(editData.name || "");
        setVehicleType(editData.vehicleType || "4wheeler");
        setCategory(editData.category || "hatchback");
        setStatus(editData.status || "active");
        setImagePreview(editData.image ? `${API_BASE}${editData.image}` : null);
      } else {
        setName("");
        setVehicleType("4wheeler");
        setCategory("hatchback");
        setStatus("active");
        setImagePreview(null);
      }
      setImageFile(null);
    }
  }, [editData, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Model name is required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("vehicleType", vehicleType);
      formData.append("category", category);
      formData.append("status", status);
      formData.append(
        "brandId",
        editData?.brandId?._id || editData?.brandId || brandId,
      );
      if (imageFile) formData.append("file", imageFile);

      if (editData) {
        await vehicleCatalogService.updateModel(editData._id, formData);
        toast.success("Model updated successfully");
      } else {
        await vehicleCatalogService.createModel(formData);
        toast.success("Model added successfully");
      }
      onSuccess();
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Operation failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalManager
      isOpen={isOpen}
      onClose={onClose}
      title={
        editData
          ? `Edit Model - ${brandName || ""}`
          : `Add Model to ${brandName || ""}`
      }
      pageName="VEHICLE_CATALOG"
      modalType={editData ? "EDIT" : "CREATE"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Model Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Model Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            placeholder="e.g., i20, Creta, Swift"
            autoFocus
          />
        </div>

        {/* Vehicle Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Vehicle Type
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setVehicleType("4wheeler");
                setCategory("hatchback");
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                vehicleType === "4wheeler"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              🚗 4 Wheeler
            </button>
            <button
              type="button"
              onClick={() => {
                setVehicleType("2wheeler");
                setCategory("bike");
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                vehicleType === "2wheeler"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              🏍️ 2 Wheeler
            </button>
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all capitalize"
          >
            {(vehicleType === "4wheeler" ? categories4w : categories2w).map(
              (cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat === "suv"
                    ? "SUV"
                    : cat === "muv"
                      ? "MUV"
                      : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ),
            )}
          </select>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Vehicle Image
          </label>
          <div
            className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => document.getElementById("model-image-input").click()}
          >
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-18 object-contain mx-auto"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <p className="text-sm text-indigo-600 font-medium">
                  + Upload Image
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Max file size: 5MB
                </p>
              </>
            )}
            <input
              id="model-image-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setStatus(status === "active" ? "inactive" : "active")
              }
              className={`relative w-11 h-6 rounded-full transition-colors ${
                status === "active" ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  status === "active" ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-slate-600 capitalize">{status}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-70"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </div>
      </form>
    </ModalManager>
  );
};

export default VehicleManagement;
