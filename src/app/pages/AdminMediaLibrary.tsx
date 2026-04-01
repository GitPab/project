import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router';
import { 
  Image, Upload, Copy, CheckCircle2, 
  Trash2, Search, Grid, List, ExternalLink,
  Building2, Palette, FolderOpen, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import api from '../services/api';

// Media item interface
interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'background' | 'logo' | 'university';
  universityId?: string;
  universityName?: string;
  size: string;
  createdAt: string;
  uploadedBy?: string;
}

export default function AdminMediaLibrary() {
  const navigate = useNavigate();
  const { universities } = useApp();
  
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTab, setSelectedTab] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load media from API on mount
  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/media');
      if (response.data.success) {
        setMediaItems(response.data.data);
      } else {
        // Fallback: try to load from localStorage
        const saved = localStorage.getItem('mediaLibrary');
        if (saved) {
          setMediaItems(JSON.parse(saved));
        }
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
      // Fallback: try to load from localStorage
      const saved = localStorage.getItem('mediaLibrary');
      if (saved) {
        setMediaItems(JSON.parse(saved));
      }
      toast.error('Không thể tải danh sách media');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter items based on search and tab
  const filteredItems = mediaItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.universityName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = selectedTab === 'all' || item.type === selectedTab;
    return matchesSearch && matchesTab;
  });

  const handleCopyUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success('Đã sao chép URL!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error('Không thể sao chép URL');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/media/${id}`);
      setMediaItems(prev => prev.filter(item => item.id !== id));
      toast.success('Đã xóa ảnh');
    } catch (error) {
      console.error('Delete media error:', error);
      toast.error('Không thể xóa ảnh');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const uploadedItems: MediaItem[] = [];
      
      for (const file of Array.from(files)) {
        // Convert file to base64 for upload
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const base64 = await base64Promise;
        
        // Upload to API
        const response = await api.post('/media', {
          name: file.name,
          url: base64,
          type: type,
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
        });
        
        if (response.data.success) {
          uploadedItems.push(response.data.data);
        }
      }

      setMediaItems(prev => [...uploadedItems, ...prev]);
      toast.success(`Đã tải lên ${uploadedItems.length} ảnh!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Không thể tải lên ảnh');
    } finally {
      setIsUploading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'background': return <Palette className="w-4 h-4 text-purple-500" />;
      case 'logo': return <Building2 className="w-4 h-4 text-blue-500" />;
      case 'university': return <Image className="w-4 h-4 text-green-500" />;
      default: return <Image className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'background': return 'Ảnh nền';
      case 'logo': return 'Logo trường';
      case 'university': return 'Ảnh trường';
      default: return 'Khác';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-blue-600" />
            Kho Media
          </h1>
          <p className="text-slate-500 mt-1">
            Quản lý ảnh nền, logo và hình ảnh trường học
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4 mr-2" /> : <Grid className="w-4 h-4 mr-2" />}
            {viewMode === 'grid' ? 'Danh sách' : 'Lưới'}
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="border-dashed border-2 border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Upload Background */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleUpload(e, 'background')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="bg-white rounded-lg p-4 border-2 border-dashed border-purple-300 hover:border-purple-500 transition-all text-center">
                <Palette className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="font-medium text-sm">Tải ảnh nền</p>
                <p className="text-xs text-slate-500">Kéo thả hoặc click</p>
              </div>
            </div>

            {/* Upload Logo */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleUpload(e, 'logo')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="bg-white rounded-lg p-4 border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all text-center">
                <Building2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-medium text-sm">Tải logo trường</p>
                <p className="text-xs text-slate-500">PNG, SVG tốt nhất</p>
              </div>
            </div>

            {/* Upload University Image */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleUpload(e, 'university')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="bg-white rounded-lg p-4 border-2 border-dashed border-green-300 hover:border-green-500 transition-all text-center">
                <Image className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-medium text-sm">Tải ảnh trường</p>
                <p className="text-xs text-slate-500">Campus, cơ sở vật chất</p>
              </div>
            </div>
          </div>

          {isUploading && (
            <div className="mt-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
              <p className="text-sm text-slate-600 mt-2">Đang tải lên...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Tìm kiếm ảnh, logo, tên trường..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="background">Nền</TabsTrigger>
            <TabsTrigger value="logo">Logo</TabsTrigger>
            <TabsTrigger value="university">Trường</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Media Grid */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <Image className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            Chưa có ảnh nào
          </h3>
          <p className="text-slate-500 mb-4">
            Tải lên ảnh để quản lý và sử dụng trong hệ thống
          </p>
          <Button onClick={() => (document.querySelector('input[type="file"]') as HTMLElement)?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Tải ảnh đầu tiên
          </Button>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          : "space-y-2"
        }>
          {filteredItems.map((item) => (
            <Card 
              key={item.id}
              className={`group overflow-hidden hover:shadow-lg transition-all ${
                viewMode === 'list' ? 'flex items-center p-2' : ''
              }`}
            >
              {/* Image Preview */}
              <div className={`relative overflow-hidden bg-slate-100 ${
                viewMode === 'list' ? 'w-16 h-16 rounded flex-shrink-0' : 'aspect-video'
              }`}>
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/img/placeholder-image.png';
                  }}
                />
                
                {/* Hover overlay with actions */}
                <div className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 ${
                  viewMode === 'list' ? 'hidden' : ''
                }`}>
                  <button
                    onClick={() => handleCopyUrl(item.url, item.id)}
                    className="p-2 bg-white rounded-full hover:bg-blue-50 transition-colors"
                    title="Sao chép URL"
                  >
                    {copiedId === item.id ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-700" />
                    )}
                  </button>
                  <button
                    onClick={() => window.open(item.url, '_blank')}
                    className="p-2 bg-white rounded-full hover:bg-blue-50 transition-colors"
                    title="Xem ảnh"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <CardContent className={`p-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" title={item.name}>
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getTypeIcon(item.type)}
                      <span className="text-xs text-slate-500">
                        {getTypeLabel(item.type)}
                      </span>
                    </div>
                    {item.universityName && (
                      <p className="text-xs text-blue-600 mt-1 truncate">
                        {item.universityName}
                      </p>
                    )}
                  </div>

                  {/* Actions for list view */}
                  {viewMode === 'list' && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleCopyUrl(item.url, item.id)}
                        className="p-2 hover:bg-slate-100 rounded"
                        title="Sao chép URL"
                      >
                        {copiedId === item.id ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 hover:bg-red-50 rounded"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-2">
                  {item.size} • {item.createdAt}
                </p>

                {/* URL display */}
                <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600 truncate font-mono">
                  {item.url.substring(0, 40)}...
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Help */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Mẹo sử dụng
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-1">
          <p>• Hover vào ảnh để sao chép URL nhanh</p>
          <p>• Sử dụng ảnh nền cho hero banner và landing page</p>
          <p>• Logo nên dùng định dạng PNG trong suốt</p>
          <p>• Ảnh trường nên có kích thước 1920x1080 trở lên</p>
        </CardContent>
      </Card>
    </div>
  );
}
