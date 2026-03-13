import React from 'react';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import { Button } from './ui/button';

export default function RouteError() {
  const error = useRouteError();

  let title = 'Đã xảy ra lỗi';
  let message = 'Vui lòng thử tải lại trang hoặc quay về trang chính.';
  let status: number | undefined;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    title = `Lỗi ${error.status}`;
    message = error.statusText || message;
  } else if (error instanceof Error) {
    message = error.message || message;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {status !== undefined && (
            <p className="text-sm font-medium text-slate-500">Mã lỗi: {status}</p>
          )}
        </div>
        <p className="text-slate-600">{message}</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => window.location.reload()}>Tải lại trang</Button>
          <Button variant="outline" asChild>
            <Link to="/">Về trang chính</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
