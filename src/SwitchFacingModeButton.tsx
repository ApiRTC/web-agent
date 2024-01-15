import React, { useContext, useState } from 'react';

import { Box, CircularProgress, useThemeProps } from '@mui/material';
import Icon from '@mui/material/Icon';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';

import { StreamContext } from '@apirtc/mui-react-lib';

export interface SwitchFacingModeButtonProps extends IconButtonProps {
    tooltip?: string,
    tooltipProps?: Omit<TooltipProps, 'title' | 'children'>,
    children?: React.ReactNode
};
const COMPONENT_NAME = "SwitchFacingModeButton";
export function SwitchFacingModeButton(inProps: SwitchFacingModeButtonProps) {

    const props = useThemeProps({ props: inProps, name: COMPONENT_NAME });

    const { id = "switch-facing-mode-btn",
        tooltip = "Switch facing mode",
        children, sx,
        tooltipProps = { placement: 'left', arrow: true },
        ...rest } = props;
    const ariaLabel = props['aria-label'] ?? "switch facing mode";

    const { stream } = useContext(StreamContext);

    const [inProgress, setInProgress] = useState(false);

    const onSwitch = (event: React.SyntheticEvent) => {
        event.preventDefault()
        if (stream) {
            setInProgress(true)
            stream.getContact().sendData({ switchFacingMode: true }).then(() => {
                if (globalThis.logLevel.isDebugEnabled) {
                    console.debug(`${COMPONENT_NAME}|switchFacingMode sent`)
                }
            }).catch((error: any) => {
                if (globalThis.logLevel.isWarnEnabled) {
                    console.warn(`${COMPONENT_NAME}|switchFacingMode send failure`, error)
                }
            }).finally(() => {
                setInProgress(false)
            })
        }
    };

    return <Box sx={{
        position: 'relative'
    }}>
        <Tooltip title={tooltip} {...tooltipProps}>
            <span>{/*required by mui tooltip in case button is disabled */}
                <IconButton id={id}
                    aria-label={ariaLabel}
                    sx={{
                        ...sx,
                        position: 'relative'
                    }}
                    {...rest}
                    disabled={inProps.disabled || inProgress}
                    onClick={onSwitch}>
                    {children ? children : <Icon>switch_video</Icon>}
                    {inProgress && <CircularProgress
                        sx={{
                            position: 'absolute'
                        }}
                        style={{ width: '100%', height: '100%' }}
                    />}
                </IconButton>
            </span>
        </Tooltip>
    </Box>
}