import React from 'react';
import { useLoader } from '../../contexts/LoaderContext';
import './Loader.css';

const Loader: React.FC = () => {
    const { isLoading } = useLoader();
    console.log("isLoading", isLoading)
    if (!isLoading) return null;

    return (
        <div className="loader-overlay">
            <div className="loader"></div>
        </div>
    );
};

export default Loader;