import React from 'react';
import { Modal } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function ForgotPasswordModal({ visible, onCancel, onMethodSelect }) {
    const { isSunTheme } = useTheme();
    const { t } = useTranslation();

    const handleMethodSelect = (method) => {
        onMethodSelect(method);
        onCancel();
    };

    return (
        <Modal
            title={
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <h4
                        style={{
                            margin: 0,
                            fontWeight: 600,
                            background: isSunTheme 
                                ? 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)'
                                : 'linear-gradient(90deg, #5e17eb 0%, #4dd0ff 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                        {t('forgotPassword.title')}
                    </h4>
                </div>
            }
            open={visible}
            footer={null}
            onCancel={onCancel}
            centered
            width={480}
            style={{ borderRadius: '16px' }}>
            <div style={{ padding: '8px 0' }}>
                <p
                    style={{
                        textAlign: 'center',
                        marginBottom: '24px',
                        color: isSunTheme ? '#374151' : '#666',
                        fontSize: '16px',
                        fontWeight: 500,
                    }}>
                    {t('forgotPassword.description')}
                </p>

                <div
                    style={{
                        display: 'flex',
                        gap: '20px',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                    }}>
                    {/* Email Option */}
                    <div
                        onClick={() => handleMethodSelect('email')}
                        className='recover-option'>
                        <div className='recover-card'>
                            <div className='recover-icon'>
                                <MailOutlined style={{ fontSize: '32px', color: '#EA4335' }} />
                            </div>
                            <h6>{t('forgotPassword.viaEmail')}</h6>
                          
                        </div>
                    </div>

                    {/* Teacher Option */}
                    <div
                        onClick={() => handleMethodSelect('teacher')}
                        className='recover-option'>
                        <div className='recover-card'>
                            <div className='recover-icon'>👨‍🏫</div>
                            <h6>{t('forgotPassword.viaPhone')}</h6>
                        
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        textAlign: 'center',
                        marginTop: '24px',
                        padding: '16px 0',
                        borderTop: isSunTheme ? '1px solid #e5e7eb' : '1px solid #f0f0f0',
                    }}>
                    <p
                        style={{
                            margin: 0,
                            color: isSunTheme ? '#6b7280' : '#999',
                            fontSize: '12px',
                        }}>
                        {t('forgotPassword.footerNote')}
                    </p>
                </div>
            </div>
        </Modal>
    );
}
