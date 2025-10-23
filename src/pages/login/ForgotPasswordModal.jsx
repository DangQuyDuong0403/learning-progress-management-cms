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
                            color: isSunTheme ? '#3b82f6' : '#5e17eb',
                        }}>
                        {t('forgotPassword.title')}
                    </h4>
                </div>
            }
            open={visible}
            footer={null}
            onCancel={onCancel}
            centered
            width={500}
            styles={{
                header: {
                    background: isSunTheme ? '#ffffff' : '#ffffff',
                    borderBottom: isSunTheme ? '1px solid #e5e7eb' : '1px solid #f0f0f0',
                },
                body: {
                    background: isSunTheme ? '#ffffff' : '#ffffff',
                }
            }}
            style={{ borderRadius: '12px' }}>
            <div style={{ padding: '6px 0' }}>
                <p
                    style={{
                        textAlign: 'center',
                        marginBottom: '20px',
                        color: isSunTheme ? '#374151' : '#666',
                        fontSize: '14px',
                        fontWeight: 500,
                    }}>
                    {t('forgotPassword.description')}
                </p>

                <div
                    style={{
                        display: 'flex',
                        gap: '16px',
                        justifyContent: 'center',
                        flexWrap: 'nowrap',
                        alignItems: 'stretch',
                    }}>
                    {/* Email Option */}
                    <div
                        onClick={() => handleMethodSelect('email')}
                        className='recover-option'
                        style={{ flex: 1, minWidth: 0 }}>
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
                        className='recover-option'
                        style={{ flex: 1, minWidth: 0 }}>
                        <div className='recover-card'>
                            <div className='recover-icon'>👨‍🏫</div>
                            <h6>{t('forgotPassword.viaTeacher')}</h6>
                            <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: isSunTheme ? '#6b7280' : '#999' }}>
                                {t('forgotPassword.teacherDescription')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        textAlign: 'center',
                        marginTop: '20px',
                        padding: '12px 0',
                        borderTop: isSunTheme ? '1px solid #e5e7eb' : '1px solid #f0f0f0',
                    }}>
                    <p
                        style={{
                            margin: 0,
                            color: isSunTheme ? '#6b7280' : '#999',
                            fontSize: '11px',
                        }}>
                        {t('forgotPassword.footerNote')}
                    </p>
                </div>
            </div>
        </Modal>
    );
}
