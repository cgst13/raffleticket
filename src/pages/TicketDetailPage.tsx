import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketsRepository } from '../services/storage/ticketsRepository';
import { bookletsRepository } from '../services/storage/bookletsRepository';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { Ticket } from '../types/ticket';
import { TicketDetailModal } from '../components/tickets/TicketDetailModal';

export const TicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!ticketId) return;
    const t = ticketsRepository.getById(ticketId);
    if (!t) {
      navigate('/tickets');
      return;
    }
    setTicket(t);
  }, [ticketId, navigate]);

  if (!ticket) return null;

  return (
    <TicketDetailModal
      ticket={ticket}
      isOpen={true}
      onClose={() => navigate(-1)}
      onUpdated={() => {
        const updated = ticketsRepository.getById(ticket.id);
        setTicket(updated);
      }}
    />
  );
};
