/**
 * External dependencies
 */
import { isString } from 'lodash';

/**
 * WordPress dependencies
 */
import { switchChildrenNodeName } from 'element';
import { Toolbar } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, createBlock, query as hpq } from '../../api';
import AlignmentToolbar from '../../alignment-toolbar';
import BlockControls from '../../block-controls';
import Editable from '../../editable';

const { children, node, query } = hpq;

registerBlockType( 'core/quote', {
	title: wp.i18n.__( 'Quote' ),
	icon: 'format-quote',
	category: 'common',

	attributes: {
		value: query( 'blockquote > p', node() ),
		citation: children( 'footer' ),
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { content } ) => {
					return createBlock( 'core/quote', {
						value: content,
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/list' ],
				transform: ( { values } ) => {
					return createBlock( 'core/quote', {
						value: switchChildrenNodeName( values, 'p' ),
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { content } ) => {
					return createBlock( 'core/quote', {
						value: content,
					} );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { value, citation, ...attrs } ) => {
					const textElement = Array.isArray( value ) ? value[ 0 ] : value;
					const textContent = isString( textElement ) ? textElement : textElement.props.children;
					if ( Array.isArray( value ) || citation ) {
						const text = createBlock( 'core/text', {
							content: textContent,
						} );
						const quote = createBlock( 'core/quote', {
							...attrs,
							citation,
							value: Array.isArray( value ) ? value.slice( 1 ) : '',
						} );

						return [ text, quote ];
					}
					return createBlock( 'core/text', {
						content: textContent,
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/list' ],
				transform: ( { value, citation } ) => {
					const valueElements = switchChildrenNodeName( value, 'li' );
					const values = citation
						? wp.element.concatChildren( valueElements, <li>{ citation }</li> )
						: valueElements;
					return createBlock( 'core/list', {
						nodeName: 'ul',
						values,
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { value, citation, ...attrs } ) => {
					const headingElement = Array.isArray( value ) ? value[ 0 ] : value;
					const headingContent = isString( headingElement ) ? headingElement : headingElement.props.children;
					if ( Array.isArray( value ) || citation ) {
						const heading = createBlock( 'core/heading', {
							content: headingContent,
						} );
						const quote = createBlock( 'core/quote', {
							...attrs,
							citation,
							value: Array.isArray( value ) ? value.slice( 1 ) : '',
						} );

						return [ heading, quote ];
					}
					return createBlock( 'core/heading', {
						content: headingContent,
					} );
				},
			},
		],
	},

	edit( { attributes, setAttributes, focus, setFocus, mergeBlocks } ) {
		const { align, value, citation, style = 1 } = attributes;
		const focusedEditable = focus ? focus.editable || 'value' : null;

		return [
			focus && (
				<BlockControls key="controls">
					<Toolbar controls={ [ 1, 2 ].map( ( variation ) => ( {
						icon: 'format-quote',
						title: wp.i18n.sprintf( wp.i18n.__( 'Quote style %d' ), variation ),
						isActive: Number( style ) === variation,
						onClick() {
							setAttributes( { style: variation } );
						},
						subscript: variation,
					} ) ) } />
					<AlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
				</BlockControls>
			),
			<blockquote
				key="quote"
				className={ `blocks-quote blocks-quote-style-${ style }` }
			>
				<Editable
					value={ value }
					onChange={
						( nextValue ) => setAttributes( {
							value: nextValue,
						} )
					}
					focus={ focusedEditable === 'value' ? focus : null }
					onFocus={ ( props ) => setFocus( { ...props, editable: 'value' } ) }
					onMerge={ mergeBlocks }
					style={ { textAlign: align } }
				/>
				{ ( ( citation && citation.length > 0 ) || !! focus ) && (
					<Editable
						tagName="footer"
						value={ citation }
						placeholder={ wp.i18n.__( '— Add citation…' ) }
						onChange={
							( nextCitation ) => setAttributes( {
								citation: nextCitation,
							} )
						}
						focus={ focusedEditable === 'citation' ? focus : null }
						onFocus={ ( props ) => setFocus( { ...props, editable: 'citation' } ) }
						inline
					/>
				) }
			</blockquote>,
		];
	},

	save( { attributes } ) {
		const { align, value, citation, style = 1 } = attributes;

		return (
			<blockquote className={ `blocks-quote-style-${ style }` }>
				{ value && value.map( ( paragraph, i ) => (
					<p
						key={ i }
						style={ { textAlign: align ? align : null } }
					>
						{ isString( paragraph ) ? paragraph : paragraph.props.children }
					</p>
				) ) }
				{ citation && citation.length > 0 && (
					<footer>{ citation }</footer>
				) }
			</blockquote>
		);
	},
} );
