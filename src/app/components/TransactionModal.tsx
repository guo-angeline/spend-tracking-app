
import React, { useState } from 'react';
import { Haptics, NotificationType, ImpactStyle } from '@capacitor/haptics';
import Modal from './Modal';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: any) => Promise<void>;
    categories: any[];
}

export default function TransactionModal({ isOpen, onClose, onSave, categories }: TransactionModalProps) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('EXPENSE');
    const [categoryId, setCategoryId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!amount || isNaN(Number(amount))) {
            setError('Please enter a valid amount');
            setLoading(false);
            return;
        }

        if (!description) {
            setError('Please enter a description');
            setLoading(false);
            return;
        }

        if (!categoryId && type === 'EXPENSE') {
            // Maybe optional for Income/Transfer, but usually good to have.
            // Let's make it required for Expense.
            setError('Please select a category');
            setLoading(false);
            return;
        }

        try {
            await onSave({
                date,
                description,
                amount: Number(amount),
                type,
                categoryId: categoryId || null,
            });
            Haptics.notification({ type: NotificationType.Success }).catch(() => {});
            onClose();
            // Reset form
            setDescription('');
            setAmount('');
            setType('EXPENSE');
            setCategoryId('');
        } catch (err: any) {
            setError(err.message || 'Failed to save transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Transaction">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        {['EXPENSE', 'INCOME', 'TRANSFER'].map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => {
                                    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                                    setType(t);
                                }}
                                className={`flex-1 px-4 py-2 text-sm font-medium border first:rounded-l-md last:rounded-r-md focus:z-10 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${type === t
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                        placeholder="e.g. Lunch at Tacos"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                            placeholder="0.00"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Transaction'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
