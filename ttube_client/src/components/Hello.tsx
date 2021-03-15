import React, { Component } from "react"
import { Spinner } from '../../../src/components/Spinner'

export interface HelloProps {
    message: string
}
export class Hello extends Component<HelloProps, {}>
{
    public render(): JSX.Element {
        return (
            <div className="hello">
                <h1>{this.props.message}</h1>
                <Spinner />
                <div>
                    {this.props.children}
                </div>
            </div>
        )
    }
}