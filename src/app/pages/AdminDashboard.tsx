import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  School,
  Users,
  DollarSign,
  AlertCircle,
  Search,
  Plus,
  Eye,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Upload,
  Edit,
  Calculator,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';
import type { University } from '../context/AppContext';
import { toast } from 'sonner';
import ImportUniversitiesModal from '../components/ImportUniversitiesModal';
import UniversityForm from '../components/UniversityForm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

// Inline cost calculation to avoid import issues
interface SimpleCostCalculation {
  amount: number;
  currency: string;
  systemsIncluded: string[];
}

function calculateSimpleUniversityCost(university: any): SimpleCostCalculation {
  // Calculate total from legacy fields
  const generalTuition = university.generalTuition || 0;
  const visaFee = university.visaFee || 0;
  const accommodationFee = university.accommodationFee || 0;
  const insuranceFee = university.insuranceFee || 0;
  
  // Calculate additional fees
  let additionalFeesTotal = 0;
  if (university.additionalFees && Array.isArray(university.additionalFees)) {
    additionalFeesTotal = university.additionalFees.reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0);
  }
  
  // Calculate systems-based costs if available
  let systemsTotal = 0;
  let systemsIncluded: string[] = [];
  
  if (university.systems && Array.isArray(university.systems)) {
    const availableSystems = university.systems.filter((system: any) => system.available);
    systemsIncluded = availableSystems.map((system: any) => system.code);
    
    availableSystems.forEach((system: any) => {
      if (system.fees && Array.isArray(system.fees)) {
        system.fees.forEach((fee: any) => {
          let feeAmount = 0;
          
          switch (fee.type) {
            case 'fixed':
              feeAmount = fee.base_value || 0;
              break;
            case 'optional':
              if (fee.required || fee.default_selected) {
                feeAmount = fee.base_value || 0;
              }
              break;
            case 'optional_multiple':
            case 'variable_time':
              const defaultOption = fee.options?.find((opt: any) => opt.id === fee.default_selected) || fee.options?.[0];
              if (defaultOption) {
                feeAmount = defaultOption.value || 0;
              }
              break;
            case 'percentage':
              const defaultCondition = fee.conditions?.[0];
              if (defaultCondition) {
                feeAmount = -((fee.base_value || 0) * (defaultCondition.percentage || 0)) / 100;
              }
              break;
          }
          
          systemsTotal += feeAmount;
        });
      }
    });
  }
  
  // Use systems-based calculation if available, otherwise use legacy
  const totalAmount = systemsTotal > 0 ? systemsTotal : (generalTuition + visaFee + accommodationFee + insuranceFee + additionalFeesTotal);
  
  return {
    amount: totalAmount,
    currency: 'VND',
    systemsIncluded
  };
}

function generateSimpleCostTooltip(cost: SimpleCostCalculation): string {
  let tooltip = `Estimated Total Cost: ${cost.amount.toLocaleString()} VND\n\n`;
  
  if (cost.systemsIncluded.length > 0) {
    tooltip += `Systems: ${cost.systemsIncluded.join(', ')}\n`;
  }
  
  tooltip += `Currency: ${cost.currency}`;
  
  return tooltip;
}

type SortKey = 'name' | 'country' | 'estimatedCost' | 'lastUpdated';
type SortOrder = 'asc' | 'desc';

export default function AdminDashboard() {
  const { universities, registrations, updateUniversity, addUniversities } = useApp();
  const { currency, toggleCurrency, formatFrom } = useCurrency();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Calculate estimated costs for all universities
  const costCalculations = useMemo(() => {
    const calculations = new Map<string, SimpleCostCalculation>();
    universities.forEach(university => {
      try {
        const cost = calculateSimpleUniversityCost(university);
        calculations.set(university.id, cost);
      } catch (err) {
        console.error(`Error calculating cost for ${university.name}:`, err);
        // Set default cost calculation
        calculations.set(university.id, {
          amount: 0,
          currency: 'VND',
          systemsIncluded: []
        });
      }
    });
    return calculations;
  }, [universities]);

  // Calculate stats
  const totalUniversities = universities.length;
  const activeStudents = registrations.length;
  const totalCostManaged = Array.from(costCalculations.values()).reduce((sum, cost) => sum + cost.amount, 0);
  const pendingUpdates = 0; // Mock value

  // Filter and sort universities
  const filteredAndSortedUniversities = useMemo(() => {
    let filtered = universities.filter(uni =>
      uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uni.country.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortKey) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'country':
          aValue = a.country;
          bValue = b.country;
          break;
        case 'estimatedCost':
          aValue = costCalculations.get(a.id)?.amount || 0;
          bValue = costCalculations.get(b.id)?.amount || 0;
          break;
        case 'lastUpdated':
          // Mock last updated dates
          aValue = a.id;
          bValue = b.id;
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [universities, searchTerm, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6">
      {/* Currency Toggle Button - Fixed Position */}
      <button
        onClick={toggleCurrency}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-white border-2 border-primary text-primary rounded-full shadow-lg hover:bg-primary hover:text-white transition-colors"
        title="Toggle currency"
      >
        <RefreshCw className="w-5 h-5" />
        <span className="font-semibold">{currency}</span>
      </button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">Manage universities and view registration analytics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600">Total Partner Universities</span>
            <School className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalUniversities}</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600">Active Students</span>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{activeStudents}</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600">Total Cost Managed</span>
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {formatFrom(totalCostManaged, 'VND')}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600">Pending Updates</span>
            <AlertCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-slate-900">{pendingUpdates}</p>
            {pendingUpdates > 0 && (
              <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                New
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search and Add Button */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search universities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add New University
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Upload className="w-5 h-5" />
          Import Universities
        </button>
      </div>

      {/* Universities Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Name
                    <SortIcon columnKey="name" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('country')}
                >
                  <div className="flex items-center gap-2">
                    Country
                    <SortIcon columnKey="country" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('estimatedCost')}
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Estimated Total Cost
                    <SortIcon columnKey="estimatedCost" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('lastUpdated')}
                >
                  <div className="flex items-center gap-2">
                    Last Updated
                    <SortIcon columnKey="lastUpdated" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAndSortedUniversities.map((uni) => (
                <tr 
                  key={uni.id}
                  onClick={() => navigate(`/admin/universities`)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{uni.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-700">{uni.country}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="font-semibold text-blue-600">
                              {formatFrom(costCalculations.get(uni.id)?.amount || 0, 'VND')}
                            </div>
                            {(costCalculations.get(uni.id)?.systemsIncluded.length || 0) > 0 && (
                              <div className="text-xs text-slate-600">
                                Systems: {costCalculations.get(uni.id)?.systemsIncluded.join(', ') || ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <pre className="text-xs whitespace-pre-wrap">
                          {generateSimpleCostTooltip(costCalculations.get(uni.id) || { amount: 0, currency: 'VND', systemsIncluded: [] })}
                        </pre>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/universities`);
                        }}
                        className="text-primary hover:text-primary/80 font-medium"
                      >
                        <Edit className="w-4 h-4 inline mr-1" />
                        Edit
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/universities`);
                        }}
                        className="text-slate-600 hover:text-slate-800 font-medium"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedUniversities.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No universities found matching your search.
          </div>
        )}
      </div>

      {/* Add University Form */}
      {showAddModal && (
        <UniversityForm
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            toast.success('University added successfully!');
            setShowAddModal(false);
          }}
        />
      )}

      {/* Import Universities Modal */}
      {showImportModal && (
        <ImportUniversitiesModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={(universities) => {
            addUniversities(universities);
            toast.success('Universities imported successfully!');
            setShowImportModal(false);
          }}
        />
      )}
    </div>
  </TooltipProvider>
  );
}
