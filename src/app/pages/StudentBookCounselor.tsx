import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, Video, MapPin, ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface Counselor {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  bio: string;
  availableDays: string[];
}

interface Appointment {
  id?: string;
  counselorId: string;
  counselorName: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  type: 'online' | 'in-person';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  meetingLink?: string;
  location?: string;
}

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const COUNSELORS: Counselor[] = [
  {
    id: 'counselor-1',
    name: 'Nguyễn Thị Hương',
    avatar: 'H',
    specialty: 'Tư vấn visa D2, D4',
    bio: 'Hơn 5 năm kinh nghiệm tư vấn du học Hàn Quốc, chuyên về visa học tập D2 và D4.',
    availableDays: ['T2', 'T3', 'T5', 'T6']
  },
  {
    id: 'counselor-2',
    name: 'Trần Văn Minh',
    avatar: 'M',
    specialty: 'Chuyên gia học bổng',
    bio: 'Tư vấn học bổng toàn phần và bán phần cho các trường đại học top đầu Hàn Quốc.',
    availableDays: ['T3', 'T4', 'T6', 'T7']
  },
  {
    id: 'counselor-3',
    name: 'Lê Thị Lan',
    avatar: 'L',
    specialty: 'Hỗ trợ nhà ở Hàn Quốc',
    bio: 'Chuyên tư vấn ký túc xá, thuê nhà và các vấn đề sinh hoạt tại Hàn Quốc.',
    availableDays: ['T2', 'T4', 'T5', 'T7']
  }
];

export default function StudentBookCounselor() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<'online' | 'in-person'>('online');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'counselor' | 'date' | 'time' | 'confirm'>('counselor');
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate time slots
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        // Simulate some slots being unavailable
        const available = Math.random() > 0.3;
        slots.push({ id: time, time, available });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayName = DAYS[date.getDay()];
    
    if (selectedCounselor?.availableDays.includes(dayName)) {
      setSelectedDate(date);
      setStep('time');
    } else {
      toast.error('Tư vấn viên không làm việc vào ngày này');
    }
  };

  const handleCounselorSelect = (counselor: Counselor) => {
    setSelectedCounselor(counselor);
    setStep('date');
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    if (!slot.available) {
      toast.error('Khung giờ này đã được đặt');
      return;
    }
    setSelectedTimeSlot(slot.time);
    setStep('confirm');
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot || !selectedCounselor) {
      toast.error('Vui lòng chọn đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const appointment: Appointment = {
        counselorId: selectedCounselor.id,
        counselorName: selectedCounselor.name,
        studentId: user?.id || '',
        studentName: user?.name || '',
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTimeSlot,
        type: appointmentType,
        status: 'pending',
        notes: notes,
        meetingLink: appointmentType === 'online' ? 'https://meet.tbt-group.vn/session/' + Date.now() : undefined,
        location: appointmentType === 'in-person' ? 'Văn phòng TBT Group - Tầng 3, 123 Nguyễn Văn A' : undefined
      };

      // In a real app, this would call the API
      // await api.post('/appointments', appointment);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMyAppointments(prev => [...prev, { ...appointment, id: Date.now().toString() }]);
      toast.success('Đặt lịch thành công! Vui lòng kiểm tra email xác nhận.');
      
      // Reset form
      setStep('counselor');
      setSelectedCounselor(null);
      setSelectedDate(null);
      setSelectedTimeSlot(null);
      setNotes('');
    } catch (error) {
      toast.error('Đặt lịch thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const isDateSelectable = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayName = DAYS[date.getDay()];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return selectedCounselor?.availableDays.includes(dayName) && date >= today;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Đặt lịch tư vấn</h1>
        <p className="text-gray-500">Chọn tư vấn viên và thời gian phù hợp với bạn</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center mb-8">
        {['counselor', 'date', 'time', 'confirm'].map((s, index) => {
          const labels = ['Chọn tư vấn viên', 'Chọn ngày', 'Chọn giờ', 'Xác nhận'];
          const isActive = step === s;
          const isCompleted = ['counselor', 'date', 'time', 'confirm'].indexOf(step) > index;
          
          return (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{labels[index]}</span>
              </div>
              {index < 3 && <div className="w-12 sm:w-24 h-0.5 mx-2 bg-gray-200" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Counselor */}
          {step === 'counselor' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Chọn tư vấn viên</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {COUNSELORS.map((counselor) => (
                  <button
                    key={counselor.id}
                    onClick={() => handleCounselorSelect(counselor)}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                        {counselor.avatar}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{counselor.name}</h3>
                        <p className="text-sm text-blue-600 font-medium">{counselor.specialty}</p>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{counselor.bio}</p>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {counselor.availableDays.map(day => (
                            <span key={day} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              {day}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Date */}
          {step === 'date' && selectedCounselor && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Chọn ngày</h2>
                <button
                  onClick={() => setStep('counselor')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Quay lại
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-semibold">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                  
                  {Array.from({ length: startingDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isSelectable = isDateSelectable(day);
                    const isSelected = selectedDate?.getDate() === day;
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dayName = DAYS[date.getDay()];
                    const isWorkingDay = selectedCounselor.availableDays.includes(dayName);
                    
                    return (
                      <button
                        key={day}
                        onClick={() => isSelectable && handleDateSelect(day)}
                        disabled={!isSelectable}
                        className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : isSelectable
                            ? 'hover:bg-blue-100 text-gray-900'
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={isWorkingDay ? 'Ngày làm việc' : 'Tư vấn viên nghỉ'}
                      >
                        {day}
                        {isWorkingDay && isSelectable && (
                          <span className="absolute bottom-1 w-1 h-1 bg-green-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-gray-600">Có lịch trống</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-gray-300 rounded-full" />
                    <span className="text-gray-600">Không làm việc</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Select Time */}
          {step === 'time' && selectedDate && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Chọn khung giờ - {formatDate(selectedDate)}</h2>
                <button
                  onClick={() => setStep('date')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Quay lại
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleTimeSelect(slot)}
                      disabled={!slot.available}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        selectedTimeSlot === slot.time
                          ? 'bg-blue-600 text-white'
                          : slot.available
                          ? 'bg-gray-100 hover:bg-blue-100 text-gray-900'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 bg-gray-100 rounded" />
                  <span className="text-gray-600">Có sẵn</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 bg-gray-50 rounded" />
                  <span className="text-gray-600">Đã đặt</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && selectedDate && selectedTimeSlot && selectedCounselor && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Xác nhận đặt lịch</h2>
                <button
                  onClick={() => setStep('time')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Quay lại
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                  <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                    {selectedCounselor.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedCounselor.name}</h3>
                    <p className="text-sm text-blue-600">{selectedCounselor.specialty}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Ngày</p>
                      <p className="font-medium">{formatDate(selectedDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Giờ</p>
                      <p className="font-medium">{selectedTimeSlot}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-2">Hình thức tư vấn</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAppointmentType('online')}
                      className={`flex-1 p-3 border-2 rounded-lg flex items-center gap-2 transition-colors ${
                        appointmentType === 'online' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <Video className="w-5 h-5" />
                      <span>Trực tuyến</span>
                    </button>
                    <button
                      onClick={() => setAppointmentType('in-person')}
                      className={`flex-1 p-3 border-2 rounded-lg flex items-center gap-2 transition-colors ${
                        appointmentType === 'in-person' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <MapPin className="w-5 h-5" />
                      <span>Trực tiếp</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Mô tả ngắn gọn vấn đề bạn cần tư vấn..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleBookAppointment}
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: My Appointments */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">Lịch hẹn của tôi</h3>
            
            {myAppointments.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chưa có lịch hẹn nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myAppointments.map((apt) => (
                  <div key={apt.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                        {apt.counselorName.charAt(0)}
                      </div>
                      <span className="font-medium text-sm">{apt.counselorName}</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{new Date(apt.date).toLocaleDateString('vi-VN')}</p>
                      <p>{apt.time}</p>
                      <div className="flex items-center gap-1">
                        {apt.type === 'online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        <span>{apt.type === 'online' ? 'Trực tuyến' : 'Trực tiếp'}</span>
                      </div>
                    </div>
                    <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded ${
                      apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {apt.status === 'confirmed' ? 'Đã xác nhận' :
                       apt.status === 'pending' ? 'Chờ xác nhận' :
                       apt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Bạn sẽ nhận được email xác nhận sau khi đặt lịch thành công.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
