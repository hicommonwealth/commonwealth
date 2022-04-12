/* @jsx m */

import m from 'mithril';

import OffchainThread from 'client/scripts/models/OffchainThread'
import ChainInfo from 'client/scripts/models/ChainInfo'
import OffchainComment from 'client/scripts/models/OffchainComment'
import AddressInfo from 'client/scripts/models/AddressInfo'
import { IUniqueId } from 'client/scripts/models/interfaces';

import 'pages/new_profile.scss';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

type ProfileActivityAttrs = {
  threads: Array<OffchainThread>,
  comments: Array<OffchainComment<IUniqueId>>,
  chains: Array<ChainInfo>,
  addresses: Array<AddressInfo>, 
};

enum ProfileActivity {
  All,
  Threads,
  Communities,
  Addresses,
}

type ProfileActivityState = {
  selectedActivity: ProfileActivity
}

const handleClick = (option: ProfileActivity, state: ProfileActivityState) => {
  state.selectedActivity = option
}

const renderActivity = (option: ProfileActivity, attrs: ProfileActivityAttrs) => {
  if (option === ProfileActivity.All)  
    return attrs.comments?.map(c => 
      <div className="activity">
        <div className="comment-icon">
          <CWIcon iconName="feedback" iconSize="small" />
        </div>
        <div className="comment-chain">
          <p> Commented in <span className="heavy"> { c.chain } </span> </p>
        </div>
        <div className="comment-date">
          <p> { transformTimestamp(c.created_at) } </p> 
        </div>
        <div className="comment-text">
          <p> { c.plaintext } </p> 
        </div>
      </div>
    )
  if (option === ProfileActivity.Threads)  
    return attrs.threads?.map(t => 
      <div className="activity"> <p> { t.title } </p> </div>
    )
  if (option === ProfileActivity.Communities)
    return attrs.chains?.map(c => 
      <a href={"/" + c.id}>
        <div className="chain-entity"> 
          <div className="chain-info">
            <img src={c.icon_url} />
            <p> { c.symbol } </p>
          </div>
        </div>
      </a>
      
    )
  if (option == ProfileActivity.Addresses)
    return attrs.addresses?.map(a => 
      <div className="activity"> <p> { a.address } </p> </div>
    )
}

const transformTimestamp = (timestamp) => {
  let date = new Date(timestamp)
  let dateString = date.toDateString()
  let timeString = date.toLocaleTimeString()
  return dateString + " " + timeString
}

const NewProfileActivity : m.Component<ProfileActivityAttrs, ProfileActivityState> = {

  oninit(vnode) {
    vnode.state.selectedActivity = ProfileActivity.All
  },

  view(vnode) {
    return(
      <div className="ProfileActivity">
        <div className="activity-nav">
          <div className={vnode.state.selectedActivity == ProfileActivity.All ? 
              "activity-nav-option selected" : "activity-nav-option"} 
            onclick={()=>{handleClick(ProfileActivity.All, vnode.state)}}
          >
            <h4> All </h4>
            <div className="activity-count"> <p> { vnode.attrs.comments?.length } </p> </div>
          </div>
          <div className={vnode.state.selectedActivity == ProfileActivity.Threads ? 
              "activity-nav-option selected" : "activity-nav-option"}  
            onclick={()=>{handleClick(ProfileActivity.Threads, vnode.state)}}
          >
            <h4> Threads </h4>
            <div className="activity-count"> <p> { vnode.attrs.threads?.length } </p> </div>
          </div>
          <div className="divider"></div>
          <div className={vnode.state.selectedActivity == ProfileActivity.Communities ? 
              "activity-nav-option selected" : "activity-nav-option"}  
            onclick={()=>{handleClick(ProfileActivity.Communities, vnode.state)}}
          >
            <h4> All Communities </h4>
          </div>
          <div className={vnode.state.selectedActivity == ProfileActivity.Addresses ? 
              "activity-nav-option selected" : "activity-nav-option"}  
            onclick={()=>{handleClick(ProfileActivity.Addresses, vnode.state)}}
          >
            <h4> All Addresses </h4>
          </div>
        </div>
        <div className="activity-section">
          {
            renderActivity(vnode.state.selectedActivity, vnode.attrs)
          }
        </div>
      </div>
    )
  }
}

export default NewProfileActivity;

