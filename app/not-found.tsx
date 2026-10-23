'use client';

import React from 'react';
import { NotFoundPage } from '../src/components/NotFoundPage';

export default function NotFound() {
  return (
    <NotFoundPage
      onNavigateHome={() => {
        window.location.href = '/';
      }}
      onNavigateClient={() => {
        window.location.href = '/#portal';
      }}
      onNavigateAdmin={() => {
        window.location.href = '/#admin';
      }}
      onNavigateAcademy={() => {
        window.location.href = '/#academy';
      }}
    />
  );
}
